import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_HOST_DIRECTORY_CHECKS,
    BUN_SQLITE_COBBLE_HOST_DIRECTORY_COMPUTERS,
    BUN_SQLITE_COBBLE_HOST_DIRECTORY_WORKSPACES,
} from "@/db/types/db";
import type { HostDirectoryAccess } from "@/src/dict/host-directory-dict";
import type { HostDirectoryCheck } from "@/src/types";
import parseHostDirectoryCheck from "@/src/utils/parse-host-directory-check";
import hostDirectoryMountPlan, {
    type HostDirectoryMount,
    type HostDirectoryMountSkip,
} from "@/src/utils/host-directory-mount-plan";
import grabComputerDataDir from "../computers/grab-computer-data-dir";

type Params = {
    computer_id: number | string;
};

/**
 * A host directory as one computer sees it: linked to the computer itself,
 * or to one of its workspaces.
 */
export type ComputerHostDirectoryLink = {
    host_directory_id: number;
    name: string;
    slug: string;
    source: string;
    access: HostDirectoryAccess;
    scope: "computer" | "workspace";
    workspace_id?: number | null;
    /** Whether a delete inside the folder waits for the user's approval. */
    gate_deletes: boolean;
    check: HostDirectoryCheck | null;
};

/**
 * The host directories mounted into a computer (`hostDirectoryMountPlan`):
 * its own links, and those of the workspaces joined to it, with the bots
 * that reach it deciding where a computer link goes. A link whose last
 * check found the folder missing is skipped, so docker never makes it as
 * root. Read by `provisionComputer` (what to mount) and by the settings
 * pages (what is mounted, and what its last check found).
 */
export default async function grabComputerHostDirectories({
    computer_id,
}: Params): Promise<{
    computer_dir: string;
    bots: { id: number; kind: string }[];
    links: ComputerHostDirectoryLink[];
    mounts: HostDirectoryMount[];
    skipped: HostDirectoryMountSkip[];
}> {
    const computer_dir = await grabComputerDataDir({ computer_id });

    const [computer_rows, workspace_rows, bots, checks] = await Promise.all([
        BunSQLite.sql<
            BUN_SQLITE_COBBLE_HOST_DIRECTORY_COMPUTERS & {
                name: string;
                slug: string;
                source: string;
            }
        >({
            sql: `SELECT hdc.*, hd.name AS name, hd.slug AS slug, hd.source AS source
                FROM host_directory_computers hdc
                JOIN host_directories hd ON hd.id = hdc.host_directory_id
                WHERE hdc.computer_id = ?
                ORDER BY hd.name COLLATE NOCASE ASC, hd.id ASC`,
            values: [computer_id],
        }),
        BunSQLite.sql<
            BUN_SQLITE_COBBLE_HOST_DIRECTORY_WORKSPACES & {
                name: string;
                slug: string;
                source: string;
            }
        >({
            sql: `SELECT hdw.*, hd.name AS name, hd.slug AS slug, hd.source AS source
                FROM host_directory_workspaces hdw
                JOIN host_directories hd ON hd.id = hdw.host_directory_id
                JOIN workspace_computers wc ON wc.workspace_id = hdw.workspace_id
                WHERE wc.computer_id = ?
                ORDER BY hd.name COLLATE NOCASE ASC, hd.id ASC`,
            values: [computer_id],
        }),
        BunSQLite.sql<{ id: number; kind: string }>({
            sql: `SELECT DISTINCT b.id, b.kind FROM bots b
                WHERE b.kind = 'coordinator'
                    OR b.id IN (SELECT bot_id FROM bot_computers WHERE computer_id = ?)
                    OR b.id IN (
                        SELECT wb.bot_id FROM workspace_bots wb
                        JOIN workspace_computers wc ON wc.workspace_id = wb.workspace_id
                        WHERE wc.computer_id = ?
                    )
                ORDER BY b.id ASC`,
            values: [computer_id, computer_id],
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_HOST_DIRECTORY_CHECKS>({
            sql: `SELECT * FROM host_directory_checks WHERE computer_id = ?`,
            values: [computer_id],
        }),
    ]);

    const checked_on = (host_directory_id: number | string) => {
        const row = (checks.payload || []).find(
            (check) => check.host_directory_id == Number(host_directory_id),
        );

        return parseHostDirectoryCheck({ text: row?.last_check });
    };

    const links: ComputerHostDirectoryLink[] = [
        ...(computer_rows.payload || []).map(({ name, slug, source, ...row }) => ({
            host_directory_id: Number(row.host_directory_id),
            name,
            slug,
            source,
            access: (row.access || "read-write") as HostDirectoryAccess,
            scope: "computer" as const,
            gate_deletes: Number(row.gate_deletes) != 0,
            check: checked_on(Number(row.host_directory_id)),
        })),
        ...(workspace_rows.payload || []).map(({ name, slug, source, ...row }) => ({
            host_directory_id: Number(row.host_directory_id),
            name,
            slug,
            source,
            access: (row.access || "read-write") as HostDirectoryAccess,
            scope: "workspace" as const,
            workspace_id: Number(row.workspace_id),
            gate_deletes: Number(row.gate_deletes) != 0,
            check: checked_on(Number(row.host_directory_id)),
        })),
    ];

    const missing = links
        .filter((link) => {
            const accounts = link.check?.accounts || [];

            return accounts.length > 0 && !accounts.some((account) => account.readable);
        })
        .map((link) => link.host_directory_id);

    const plan = hostDirectoryMountPlan({
        computer_dir,
        computer_links: links
            .filter((link) => link.scope == "computer")
            .map((link) => ({
                host_directory_id: link.host_directory_id,
                slug: link.slug,
                source: link.source,
                access: link.access,
            })),
        workspace_links: links
            .filter((link) => link.scope == "workspace")
            .map((link) => ({
                host_directory_id: link.host_directory_id,
                slug: link.slug,
                source: link.source,
                access: link.access,
                workspace_id: Number(link.workspace_id),
            })),
        bots: bots.payload || [],
        missing,
    });

    return {
        computer_dir,
        bots: (bots.payload || []).map((bot) => ({ id: Number(bot.id), kind: bot.kind })),
        links,
        ...plan,
    };
}