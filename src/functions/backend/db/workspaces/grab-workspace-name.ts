import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    workspace_id?: number | string | null;
};

/**
 * A workspace's name as it is, without an access check, for copy the
 * caller already decided to show. Null when there's none.
 */
export default async function grabWorkspaceName({ workspace_id }: Params): Promise<string | null> {
    if (!workspace_id) return null;

    const res = await BunSQLite.sql<{ name: string | null }>({
        sql: `SELECT name FROM workspaces WHERE id = ? LIMIT 1`,
        values: [Number(workspace_id)],
    });

    return res.payload?.[0]?.name || null;
}
