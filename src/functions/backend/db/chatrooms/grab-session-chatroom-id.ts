import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id?: number | string | null;
};

/**
 * The chatroom a session is a bot's part of, or null for an ordinary
 * session.
 */
export default async function grabSessionChatroomId({ session_id }: Params) {
    if (!session_id) return null;

    const chatroom_id = (
        await BunSQLite.sql<{ chatroom_id: number | null }>({
            sql: `SELECT chatroom_id FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [session_id],
        })
    ).payload?.[0]?.chatroom_id;

    return chatroom_id ? Number(chatroom_id) : null;
}
