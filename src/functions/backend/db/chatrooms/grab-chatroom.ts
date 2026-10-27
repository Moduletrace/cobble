import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";

type Params = {
    chatroom_id: number | string;
    /**
     * Only the room's own user's. Left out for server-side work (the queue).
     */
    user_id?: number | string;
};

/**
 * A chatroom by id, only if it's the user's own when one is given.
 */
export default async function grabChatroom({
    chatroom_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_CHATROOMS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
        sql: user_id
            ? `SELECT * FROM chatrooms WHERE id = ? AND user_id = ? LIMIT 1`
            : `SELECT * FROM chatrooms WHERE id = ? LIMIT 1`,
        values: user_id ? [chatroom_id, user_id] : [chatroom_id],
    });

    return res.payload?.[0] || null;
}
