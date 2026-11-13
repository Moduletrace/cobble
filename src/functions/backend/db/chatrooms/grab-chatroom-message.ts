import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    message_id: number | string;
    /**
     * Only a message posted in one of the user's own rooms.
     */
    user_id: number | string;
};

type ChatroomMessageRef = {
    id: number;
    created_at: number;
    chatroom_id: number;
};

/**
 * A message posted in a chatroom of the user's, with the room it's in, or
 * null. The access check for what the message's details may show.
 */
export default async function grabChatroomMessage({
    message_id,
    user_id,
}: Params): Promise<ChatroomMessageRef | null> {
    const row = (
        await BunSQLite.sql<ChatroomMessageRef>({
            sql: `SELECT m.id, m.created_at, s.chatroom_id FROM bot_messages m
                JOIN bot_sessions s ON s.id = m.session_id
                JOIN chatrooms c ON c.id = s.chatroom_id
                WHERE m.id = ? AND c.user_id = ? AND s.chatroom_id IS NOT NULL
                LIMIT 1`,
            values: [message_id, user_id],
        })
    ).payload?.[0];

    if (!row?.id) return null;

    return {
        id: Number(row.id),
        created_at: Number(row.created_at) || 0,
        chatroom_id: Number(row.chatroom_id),
    };
}