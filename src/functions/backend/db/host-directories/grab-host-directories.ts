import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_HOST_DIRECTORIES,
    BUN_SQLITE_COBBLE_HOST_DIRECTORY_CHECKS,
    BUN_SQLITE_COBBLE_HOST_DIRECTORY_COMPUTERS,
    BUN_SQLITE_COBBLE_HOST_DIRECTORY_WORKSPACES,
} from "@/db/types/db";
import type { HostDirectoryCheck, HostDirectoryWithLinks } from "@/src/types";
import hostDirectoryLinkUids from "@/src/utils/host-directory-link-uids";
import parseHostDirectoryCheck from "@/src/utils/parse-host-directory-check";

type Params = {
    /**
     * One directory instead of all of them.
     */
    host_directory_id?: number | string;
};

type ComputerLinkRow = BUN_SQLITE_COBBLE_HOST_DIRECTORY_COMPUTERS & {
    computer_name?: string | null;
};

type WorkspaceLinkRow = BUN_SQLITE_COBBLE_HOST_DIRECTORY_WORKSPACES & {
    workspace_name?: string | null;
    image_media_id?: number | null;
};

type CheckRow = BUN_SQLITE_COBBLE_HOST_DIRECTORY_CHECKS;

/**
 * The host directories (Settings > Host directories), each with the
 * computers and workspaces it is linked to, what its last check on each
 * computer found, and the accounts that see it there (`uids`), by name.
 * Read-only: a check is parsed, never raw, and a workspace link carries the
 * checks of every computer the workspace is on.
 */
export default async function grabHostDirectories({
    host_directory_id,
}: Params = {}): Promise<HostDirectoryWithLinks[]> {
    const filtered = host_directory_id !== undefined;

    const [
        directories,
        computers,
        workspaces,
        checks,
        workspace_computers,
        bots,
        bot_computers,
        workspace_bots,
    ] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_HOST_DIRECTORIES>({
            sql: `SELECT * FROM host_directories ${filtered ? "WHERE id = ?" : ""}
                ORDER BY name COLLATE NOCASE ASC, id ASC`,
            values: filtered ? [host_directory_id] : [],
        }),
        BunSQLite.sql<ComputerLinkRow>({
            sql: `SELECT hdc.*, c.name AS computer_name FROM host_directory_computers hdc
                LEFT JOIN computers c ON c.id = hdc.computer_id
                ${filtered ? "WHERE hdc.host_directory_id = ?" : ""}
                ORDER BY hdc.id ASC`,
            values: filtered ? [host_directory_id] : [],
        }),
        BunSQLite.sql<WorkspaceLinkRow>({
            sql: `SELECT hdw.*, w.name AS workspace_name, w.image_media_id AS image_media_id
                FROM host_directory_workspaces hdw
                LEFT JOIN workspaces w ON w.id = hdw.workspace_id
                ${filtered ? "WHERE hdw.host_directory_id = ?" : ""}
                ORDER BY hdw.id ASC`,
            values: filtered ? [host_directory_id] : [],
        }),
        BunSQLite.sql<CheckRow>({
            sql: `SELECT * FROM host_directory_checks
                ${filtered ? "WHERE host_directory_id = ?" : ""}
                ORDER BY checked_at DESC`,
            values: filtered ? [host_directory_id] : [],
        }),
        BunSQLite.sql<{ workspace_id: number; computer_id: number }>({
            sql: `SELECT workspace_id, computer_id FROM workspace_computers`,
            values: [],
        }),
        BunSQLite.sql<{ id: number; kind: string }>({
            sql: `SELECT id, kind FROM bots`,
            values: [],
        }),
        BunSQLite.sql<{ bot_id: number; computer_id: number }>({
            sql: `SELECT bot_id, computer_id FROM bot_computers`,
            values: [],
        }),
        BunSQLite.sql<{ bot_id: number; workspace_id: number }>({
            sql: `SELECT bot_id, workspace_id FROM workspace_bots`,
            values: [],
        }),
    ]);

    const reach = {
        bots: bots.payload || [],
        bot_computers: bot_computers.payload || [],
        workspace_bots: workspace_bots.payload || [],
        workspace_computers: workspace_computers.payload || [],
    };

    const check_rows = (checks.payload || []).flatMap((row) => {
        const check = parseHostDirectoryCheck({ text: row.last_check });

        return check ? [{ host_directory_id: Number(row.host_directory_id), check }] : [];
    });
    const workspace_computer_rows = workspace_computers.payload || [];

    return (directories.payload || []).map((directory) => {
        const checked_on = (computer_id: number | string) =>
            check_rows.find(
                (row) => row.check.computer_id == Number(computer_id) && row.host_directory_id == directory.id,
            )?.check || null;

        return {
            ...directory,
            computers: (computers.payload || [])
                .filter((row) => row.host_directory_id == directory.id)
                .map((row) => ({
                    ...row,
                    uids: hostDirectoryLinkUids({
                        ...reach,
                        scope: "computer",
                        computer_id: Number(row.computer_id),
                    }),
                    check: checked_on(Number(row.computer_id)),
                })),
            workspaces: (workspaces.payload || [])
                .filter((row) => row.host_directory_id == directory.id)
                .map((row) => {
                    const computer_ids = workspace_computer_rows
                        .filter((link) => link.workspace_id == row.workspace_id)
                        .map((link) => Number(link.computer_id));

                    return {
                        ...row,
                        computer_ids,
                        uids: hostDirectoryLinkUids({
                            ...reach,
                            scope: "workspace",
                            workspace_id: Number(row.workspace_id),
                        }),
                        checks: computer_ids
                            .map((computer_id) => checked_on(computer_id))
                            .filter((check): check is HostDirectoryCheck => Boolean(check)),
                    };
                }),
            checks: check_rows
                .filter((row) => row.host_directory_id == directory.id)
                .map((row) => row.check),
        };
    });
}