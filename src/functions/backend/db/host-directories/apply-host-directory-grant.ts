import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HOST_DIRECTORIES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import grabComputerImage from "@/src/functions/backend/docker/grab-computer-image";
import grantHostDirectory from "@/src/functions/backend/docker/grant-host-directory";
import logEvent from "@/src/functions/backend/logger";
import checkHostDirectory from "./check-host-directory";
import grabHostDirectories from "./grab-host-directories";
import grabHostDirectoryComputers from "./grab-host-directory-computers";

type Params = {
    host_directory_id: number | string;
    /**
     * Who is asking, when a person is: the computers are checked again
     * afterwards, so the page shows what the grant did. Left out by the
     * sync, which only keeps the folder in step with the crew.
     */
    user_id?: number | string;
    /**
     * Whether a grant that failed last time is tried again (default). The
     * sync leaves it off, so a folder whose permissions the user hasn't
     * fixed yet doesn't start a container every five minutes.
     */
    retry?: boolean;
};

export type HostDirectoryGrantResult = {
    /**
     * The accounts that see the folder now.
     */
    uids: number[];
    /**
     * The accounts the folder was granted to, as last recorded.
     */
    granted: number[];
    added: number[];
    removed: number[];
    error: string | null;
};

/**
 * Gives the folder to every bot that sees it, and takes it from the ones
 * that no longer do: the difference between the accounts the crew has now
 * (`hostDirectoryLinkUids`, over the directory's links) and the ones it was
 * granted to last time, applied by a throwaway container as root
 * (`grantHostDirectory`, ACL entries only). A link or a new bot in a
 * workspace is all it takes for the bots to be able to work there; the
 * folder's owner, group and mode are never touched.
 *
 * Nothing runs when the accounts are the same as last time, unless the last
 * try failed, which is tried again.
 */
export default async function applyHostDirectoryGrant({
    host_directory_id,
    user_id,
    retry = true,
}: Params): Promise<HostDirectoryGrantResult> {
    const directory = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HOST_DIRECTORIES>({
            sql: `SELECT * FROM host_directories WHERE id = ?`,
            values: [host_directory_id],
        })
    ).payload?.[0];

    if (!directory?.id) {
        throw new AppError("Host directory not found.");
    }

    const source = String(directory.source || "");
    const links = (await grabHostDirectories({ host_directory_id }))[0];

    const uids = [
        ...new Set(
            [...(links?.computers || []), ...(links?.workspaces || [])].flatMap(
                (link) => link.uids || [],
            ),
        ),
    ].sort((a, b) => a - b);

    const previous = (
        await BunSQLite.sql<{
            uids: string | null;
            error: string | null;
            granted_at: number | null;
        }>({
            sql: `SELECT uids, error, granted_at FROM host_directory_grants WHERE host_directory_id = ?`,
            values: [directory.id],
        })
    ).payload?.[0];

    const granted = parseUids({ text: previous?.uids });

    /**
     * A failure is tried again whole: the entries that did get applied are
     * set again, which is the same as leaving them.
     */
    const added =
        retry && previous?.error
            ? uids
            : uids.filter((uid) => !granted.includes(uid));
    const removed = granted.filter((uid) => !uids.includes(uid));

    if (!added.length && !removed.length && !(retry && previous?.error)) {
        return { uids, granted, added, removed, error: null };
    }

    const now = Date.now();
    const run = await grantHostDirectory({
        image: await grabComputerImage(),
        source,
        added,
        removed,
    });

    await BunSQLite.sql({
        sql: `INSERT INTO host_directory_grants (host_directory_id, uids, granted_at, error, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(host_directory_id) DO UPDATE SET
                uids = excluded.uids,
                granted_at = excluded.granted_at,
                error = excluded.error,
                updated_at = excluded.updated_at`,
        values: [
            directory.id,
            JSON.stringify(run.error ? granted : uids),
            run.error ? previous?.granted_at || null : now,
            run.error,
            now,
            now,
        ],
    });

    if (run.error) {
        await logEvent({
            title: "giving bots access to a host directory failed",
            category: "system",
            plain_text: `Host directory #${directory.id} (${source}) couldn't be given to the bots: ${run.error}`,
            details: [
                { label: "Folder", value: source },
                { label: "Reason", value: run.error },
            ],
            metadata: { host_directory_id: Number(directory.id) },
        });

        return { uids, granted, added, removed, error: run.error };
    }

    if (added.length || removed.length) {
        await logEvent({
            title: "bots were given access to a host directory",
            category: "system",
            plain_text: `Host directory #${directory.id} (${source}): ${added.length} account(s) given access, ${removed.length} taken away.`,
            details: [
                { label: "Folder", value: source },
                { label: "Given access", value: added },
                { label: "Access taken away", value: removed },
            ],
            metadata: {
                host_directory_id: Number(directory.id),
                added,
                removed,
            },
        });
    }

    if (user_id) {
        for (const computer_id of await grabHostDirectoryComputers({
            host_directory_id: directory.id,
        })) {
            await checkHostDirectory({
                user_id,
                host_directory_id: directory.id,
                computer_id,
            }).catch(() => {});
        }
    }

    return { uids, granted: uids, added, removed, error: null };
}

function parseUids({ text }: { text?: string | null }): number[] {
    if (!text) return [];

    try {
        const value = JSON.parse(text);

        if (!Array.isArray(value)) return [];

        return value
            .map((uid) => Number(uid))
            .filter((uid) => Number.isInteger(uid) && uid > 0);
    } catch {
        return [];
    }
}