import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import grabComputerUsage from "@/src/functions/backend/computers/grab-computer-usage";
import grabComputerWorkspaceQuotaBytes from "@/src/functions/backend/db/app-settings/grab-computer-workspace-quota-bytes";
import logEvent from "@/src/functions/backend/logger";
import formatBytes from "@/src/utils/format-bytes";
import grabComputerMcpUrl from "./grab-computer-mcp-url";

export type FullComputerWorkspace = {
    computer_id: number;
    name: string;
    used_bytes: number;
    quota_bytes: number;
    /**
     * The biggest folder in it, from the agent's own listing.
     */
    folder: string | null;
};

type Params = {
    /**
     * The share of the quota past which a computer is reported, so the
     * install hears about it while writes still fit. `AppData.ComputerWorkspaceWarnShare`
     * when left out.
     */
    share?: number;
};

/**
 * Logs every computer whose workspace is nearly full, with what holds most
 * of it, and returns them. The workspace is the one folder on a computer
 * mounted from the data volume, so it is what can fill the host; nothing
 * prunes a bot's own files there (only caches, `prune-computer-caches`), so
 * without this the first sign is a bot refused its write (`21.3 GB of
 * 10.0 GB` on a real computer, nobody told until a run failed).
 *
 * Reported, never deleted: whose files to remove is the user's call.
 */
export default async function warnFullComputerWorkspaces({ share }: Params = {}): Promise<
    FullComputerWorkspace[]
> {
    const quota_bytes = await grabComputerWorkspaceQuotaBytes();

    if (quota_bytes <= 0) return [];

    const threshold = quota_bytes * (share ?? AppData.ComputerWorkspaceWarnShare);
    const rows =
        (
            await BunSQLite.sql<{ id: number; name: string | null }>({
                sql: `SELECT id, name FROM computers`,
            })
        ).payload || [];
    const full: FullComputerWorkspace[] = [];

    for (const row of rows) {
        const address = await grabComputerMcpUrl({ computer_id: row.id }).catch(() => null);

        if (!address?.ready) continue;

        const usage = await grabComputerUsage({
            computer: { base_url: address.base_url, token: address.token },
        }).catch(() => null);

        if (!usage || usage.used_bytes < threshold) continue;

        const entry: FullComputerWorkspace = {
            computer_id: Number(row.id),
            name: row.name || `#${row.id}`,
            used_bytes: usage.used_bytes,
            quota_bytes,
            folder: usage.folders?.[0]?.path || null,
        };

        full.push(entry);

        await logEvent({
            title: `Computer ${entry.name} is nearly full`,
            category: "system",
            plain_text: `Computer ${entry.name} (#${entry.computer_id}) holds ${formatBytes({ bytes: entry.used_bytes })} of its ${formatBytes({ bytes: quota_bytes })} workspace limit${entry.folder ? `, most of it in ${entry.folder}` : ""}. Writes are refused once it passes the limit; clear the folder in Files, or raise the limit in Settings > General.`,
            metadata: {
                computer_id: entry.computer_id,
                used_bytes: entry.used_bytes,
                quota_bytes,
                folder: entry.folder,
            },
        }).catch(() => {});
    }

    return full;
}