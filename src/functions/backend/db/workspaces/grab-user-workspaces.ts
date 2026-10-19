import BunSQLite from "@moduletrace/bun-sqlite";
import type { WorkspaceWithActivity } from "@/src/types";

type Params = {
    user_id: number | string;
};

/**
 * The user's workspaces for the rail, not archived, oldest first, each
 * unread while any conversation in it is.
 */
export default async function grabUserWorkspaces({
    user_id,
}: Params): Promise<WorkspaceWithActivity[]> {
    const res = await BunSQLite.sql<WorkspaceWithActivity>({
        sql: `SELECT w.*,
                COALESCE((SELECT MAX(s.unread) FROM bot_sessions s WHERE s.workspace_id = w.id), 0) AS unread,
                (SELECT MAX(s.last_activity_at) FROM bot_sessions s WHERE s.workspace_id = w.id) AS last_activity_at
            FROM workspaces w
            WHERE w.user_id = ? AND w.archived = 0
            ORDER BY w.id ASC`,
        values: [user_id],
    });

    return res.payload || [];
}
