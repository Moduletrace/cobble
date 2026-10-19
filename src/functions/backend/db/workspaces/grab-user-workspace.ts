import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import workspacesSql from "@/src/utils/crew-access/workspaces-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    workspace_id: number | string;
    user_id: number | string;
};

/**
 * A workspace only if the user works in it (`workspacesSql`).
 */
export default async function grabUserWorkspace({
    workspace_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_WORKSPACES | null> {
    const access = workspacesSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
        sql: `SELECT w.* FROM workspaces w WHERE w.id = ? AND ${access.sql} LIMIT 1`,
        values: [workspace_id, ...access.values],
    });

    return res.payload?.[0] || null;
}
