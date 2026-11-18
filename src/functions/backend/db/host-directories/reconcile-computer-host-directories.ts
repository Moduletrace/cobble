import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import hostDirectoryMountsChanged from "@/src/utils/host-directory-mounts-changed";
import logEvent, { logError } from "@/src/functions/backend/logger";
import grabEnv from "../envs/grab-env";
import grabComputerMetadata from "../computers/grab-computer-metadata";
import grabComputerHostDirectories from "./grab-computer-host-directories";
import grabUserComputers from "../computers/grab-user-computers";
import isComputerBusy from "../computers/is-computer-busy";
import provisionComputer from "../computers/provision-computer";

type Params = {
    /**
     * One computer.
     */
    computer_id?: number | string;
    /**
     * Every computer a workspace is on.
     */
    workspace_id?: number | string;
    /**
     * Wait for the computers to be set up again before returning (a cron
     * run). A page's own save doesn't: it returns while they set up.
     */
    wait?: boolean;
};

type ReconcileOneParams = {
    computer_id: number;
    wait: boolean;
};

/**
 * Gives one computer the host directories it should have now, by setting it
 * up again when they differ from what its container was made with. Refused
 * while the computer is still being set up or a job works on it (that job
 * would lose its run), and for a computer reached at `MAIN_COMPUTER_URL`,
 * which this install doesn't make. Returns whether it will be recreated.
 */
async function reconcileOne({ computer_id, wait }: ReconcileOneParams) {
    const computer = (await grabUserComputers({ computer_id }))[0];

    if (!computer?.id) return false;

    /**
     * Only a container that is up is set up again: one that is stopped
     * keeps the mounts it had until it runs, and one still being set up is
     * already taking them.
     */
    if (computer.status != "running" && computer.status != "unhealthy") return false;
    if (await isComputerBusy({ computer_id })) return false;

    const external =
        computer.kind == "main" && Boolean((await grabEnv({ key: "MAIN_COMPUTER_URL" }))?.trim());

    if (external) return false;

    const container_metadata = await grabComputerMetadata({ computer_id });

    const stored = (() => {
        try {
            const metadata = JSON.parse(container_metadata || "{}");

            return Array.isArray(metadata?.host_mounts) ? (metadata.host_mounts as string[]) : [];
        } catch {
            return [];
        }
    })();

    const { mounts } = await grabComputerHostDirectories({ computer_id });

    if (!hostDirectoryMountsChanged({ stored, mounts })) return false;

    if (wait) {
        await provisionComputer({ computer_id });
    } else {
        provisionComputer({ computer_id }).catch((error) => {
            logError({
                title: "Couldn't set a computer up again with its host directories",
                error,
                metadata: { computer_id },
            });
        });
    }

    await logEvent({
        title: "host directories changed on a computer",
        category: "system",
        plain_text: `${computer.name || `Computer #${computer_id}`} is being set up again with ${mounts.length} host ${mounts.length == 1 ? "directory" : "directories"}.`,
        metadata: { computer_id, mounts: mounts.length },
    });

    return true;
}

/**
 * Re-applies the host directories a computer (or every computer a
 * workspace is on) should have, after a link, an unlink or an access
 * change. See `reconcileOne` for when a computer is left alone.
 */
export default async function reconcileComputerHostDirectories({
    computer_id,
    workspace_id,
    wait = false,
}: Params): Promise<number[]> {
    if (!computer_id && !workspace_id) {
        throw new AppError("Pick a computer or a workspace.");
    }

    const computer_ids = computer_id
        ? [Number(computer_id)]
        : (
              await BunSQLite.sql<{ computer_id: number }>({
                  sql: `SELECT computer_id FROM workspace_computers WHERE workspace_id = ?`,
                  values: [Number(workspace_id)],
              })
          ).payload?.map((row) => Number(row.computer_id)) || [];

    const recreated: number[] = [];

    for (const id of computer_ids) {
        if (await reconcileOne({ computer_id: id, wait })) recreated.push(id);
    }

    return recreated;
}