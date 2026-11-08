import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    workspace_id: number | string;
    user_id: number | string;
};

/**
 * Who a user is in one workspace (`workspace_user_roles`), set by a crew
 * manager, or null when nobody set it. The caller checks they work there.
 */
export default async function grabWorkspaceUserRole({ workspace_id, user_id }: Params): Promise<string | null> {
    const res = await BunSQLite.sql<{ role: string | null }>({
        sql: `SELECT role FROM workspace_user_roles WHERE workspace_id = ? AND user_id = ? LIMIT 1`,
        values: [workspace_id, user_id],
    });

    return res.payload?.[0]?.role?.trim() || null;
}
