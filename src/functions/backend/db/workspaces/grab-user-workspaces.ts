import BunSQLite from "@moduletrace/bun-sqlite";
import type { WorkspaceWithActivity } from "@/src/types";
import workspacesSql from "@/src/utils/crew-access/workspaces-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    user_id: number | string;
};

/**
 * The workspaces the user works in (`workspacesSql`), for the rail: not
 * archived, oldest first, each unread while any of the user's
 * conversations in it is.
 */
export default async function grabUserWorkspaces({
    user_id,
}: Params): Promise<WorkspaceWithActivity[]> {
    const access = workspacesSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<WorkspaceWithActivity>({
        sql: `SELECT w.*,
                COALESCE((SELECT MAX(s.unread) FROM bot_sessions s WHERE s.workspace_id = w.id AND s.user_id = ? AND s.chatroom_id IS NULL), 0) AS unread,
                (SELECT MAX(s.last_activity_at) FROM bot_sessions s WHERE s.workspace_id = w.id AND s.user_id = ? AND s.chatroom_id IS NULL) AS last_activity_at
            FROM workspaces w
            WHERE w.archived = 0 AND ${access.sql}
            ORDER BY w.id ASC`,
        values: [user_id, user_id, ...access.values],
    });

    return res.payload || [];
}
