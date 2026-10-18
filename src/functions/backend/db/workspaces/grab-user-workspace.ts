import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    workspace_id: number | string;
    user_id: number | string;
};

/**
 * A workspace only if it belongs to the given owner.
 */
export default async function grabUserWorkspace({
    workspace_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_WORKSPACES | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
        sql: `SELECT * FROM workspaces WHERE id = ? AND user_id = ? LIMIT 1`,
        values: [workspace_id, user_id],
    });

    return res.payload?.[0] || null;
}
