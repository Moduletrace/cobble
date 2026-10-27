import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    chatroom_id: number | string;
};

/**
 * Every message in a chatroom, from every bot in it, oldest first. Rooms
 * are short (the coordinator's turns are capped), so they're read whole.
 */
export default async function grabChatroomMessages({ chatroom_id }: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES[]> {
    return (
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES>({
                sql: `SELECT m.* FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id
                    WHERE s.chatroom_id = ?
                    ORDER BY m.created_at ASC, m.id ASC`,
                values: [chatroom_id],
            })
        ).payload || []
    );
}
