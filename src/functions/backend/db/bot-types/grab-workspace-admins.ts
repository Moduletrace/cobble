import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";

type Params = {
    workspace_id: number | string;
};

/**
 * The bots that are admins of a workspace and still work in it.
 */
export default async function grabWorkspaceAdmins({ workspace_id }: Params): Promise<BUN_SQLITE_COBBLE_BOTS[]> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT b.* FROM bots b
            JOIN bot_types bt ON bt.bot_id = b.id AND bt.bot_type = 'admin' AND bt.workspace_id = ?
            JOIN workspace_bots wb ON wb.bot_id = b.id AND wb.workspace_id = bt.workspace_id
            GROUP BY b.id ORDER BY b.id ASC`,
        values: [Number(workspace_id)],
    });

    return res.payload || [];
}
