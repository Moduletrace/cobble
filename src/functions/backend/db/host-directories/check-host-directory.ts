import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import type { HostDirectoryCheck } from "@/src/types";
import AppError from "@/src/utils/app-error";
import hostDirectoryAccount from "@/src/utils/host-directory-account";
import grabComputerImage from "@/src/functions/backend/docker/grab-computer-image";
import probeHostDirectory from "@/src/functions/backend/docker/probe-host-directory";
import assertHostDirectoryManager from "./assert-host-directory-manager";
import grabComputerHostDirectories from "./grab-computer-host-directories";

type Params = {
    user_id: number | string;
    host_directory_id: number | string;
    computer_id: number | string;
};

/**
 * Checks a host directory on one computer: whether its folder is still
 * there, and whether every bot that sees it can read and write in it as its
 * own account (`probeHostDirectory`, one throwaway container, which only
 * tests). Mounted in the computer, that is every bot reaching the computer;
 * mounted in a workspace, only the bots working there and the coordinator.
 * The answer is stored (`host_directory_checks`) and returned; Cobble never
 * changes the host folder's permissions itself.
 */
export default async function checkHostDirectory({
    user_id,
    host_directory_id,
    computer_id,
}: Params): Promise<HostDirectoryCheck> {
    await assertHostDirectoryManager({ user_id });

    const directory = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HOST_DIRECTORIES>({
            sql: `SELECT * FROM host_directories WHERE id = ?`,
            values: [host_directory_id],
        })
    ).payload?.[0];

    if (!directory?.id) {
        throw new AppError("Host directory not found.");
    }

    const access = await grabComputerHostDirectories({ computer_id });

    const { bots, links } = access;

    const link = links.find((row) => row.host_directory_id == directory.id);

    if (!link) {
        throw new AppError("That host directory isn't mounted on this computer.");
    }

    const members =
        link.scope == "workspace"
            ? new Set(
                  (
                      (
                          await BunSQLite.sql<{ bot_id: number }>({
                              sql: `SELECT bot_id FROM workspace_bots WHERE workspace_id = ?`,
                              values: [Number(link.workspace_id)],
                          })
                      ).payload || []
                  ).map((row) => Number(row.bot_id)),
              )
            : null;

    /** A workspace's mount is in its shared folder, so only its bots see it. */
    const seen = members
        ? bots.filter((bot) => bot.kind == "coordinator" || members.has(bot.id))
        : bots;

    const check = await probeHostDirectory({
        image: await grabComputerImage(),
        source: String(directory.source || ""),
        accounts: seen.map((bot) => {
            const workspace_ids = members ? [Number(link.workspace_id)] : [];

            return {
                bot_id: bot.id,
                name: bot.kind == "coordinator" ? "coordinator" : `bot #${bot.id}`,
                ...hostDirectoryAccount({
                    bot_id: bot.id,
                    bot_kind: bot.kind,
                    workspace_ids,
                }),
            };
        }),
    });

    const stored: HostDirectoryCheck = {
        ...check,
        computer_id: Number(computer_id),
        checked_at: Date.now(),
    };

    const now = Date.now();

    const saved = await BunSQLite.sql({
        sql: `INSERT INTO host_directory_checks (host_directory_id, computer_id, last_check, checked_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(host_directory_id, computer_id) DO UPDATE SET
                last_check = excluded.last_check,
                checked_at = excluded.checked_at,
                updated_at = excluded.updated_at`,
        values: [directory.id, computer_id, JSON.stringify(stored), now, now, now],
    });

    /**
     * A write that fails is said so: the answer is what the page shows, and
     * losing it silently left a folder looking unchecked after a check.
     */
    if (!saved.success) {
        throw new AppError(`The check couldn't be saved: ${saved.error || "the database refused it"}.`);
    }

    return stored;
}