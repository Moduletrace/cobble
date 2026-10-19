import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    workspace_id: number | string;
};

/**
 * Every user who sees a workspace (`workspacesSql`), for live updates
 * about it: super admins and admins, and the members added to it
 * (`workspace_users`). A new workspace has none of those yet.
 */
export default async function grabWorkspaceAudience({ workspace_id }: Params): Promise<number[]> {
    const res = await BunSQLite.sql<{ user_id: number }>({
        sql: `SELECT user_id FROM user_types WHERE user_type IN ('super_admin', 'admin')
            UNION
            SELECT user_id FROM workspace_users WHERE workspace_id = ?`,
        values: [workspace_id],
    });

    return (res.payload || []).map((row) => Number(row.user_id)).filter(Boolean);
}
