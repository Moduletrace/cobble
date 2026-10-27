import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import type { ChatroomSummary } from "@/src/types";
import chatroomSummaries from "./chatroom-summaries";

type Params = {
    user_id: number | string;
    /**
     * At most this many, open ones first, then the latest.
     */
    limit?: number;
    /**
     * Only one place's rooms: a workspace's, or (null) those asked from
     * bots' own chats. Left out, every room.
     */
    workspace_id?: number | null;
};

/**
 * The user's own chatrooms (all, or one place's): open ones first, then by
 * latest activity.
 */
export default async function grabUserChatrooms({ user_id, limit = 200, workspace_id }: Params): Promise<ChatroomSummary[]> {
    const scoped = workspace_id !== undefined;

    const rooms =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
                sql: `SELECT * FROM chatrooms WHERE user_id = ?${scoped ? ` AND workspace_id IS ?` : ""}
                    ORDER BY (status = 'open') DESC, COALESCE(last_activity_at, created_at) DESC, id DESC
                    LIMIT ?`,
                values: [
                    user_id,
                    ...(scoped ? [workspace_id ? Number(workspace_id) : null] : []),
                    Math.max(1, Math.floor(limit)),
                ],
            })
        ).payload || [];

    return await chatroomSummaries({ chatrooms: rooms });
}
