import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
    user_id: number | string;
};

/**
 * Clears a session's unread flag when its user has the conversation open.
 */
export default async function markBotSessionRead({ session_id, user_id }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET unread = 0
            WHERE id = ? AND unread = 1 AND user_id = ?`,
        values: [session_id, user_id],
    });
}
