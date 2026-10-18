import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * Clears a bot's unread flag when its owner opens the conversation.
 */
export default async function markBotRead({ bot_id, user_id }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE bots SET unread = 0 WHERE id = ? AND user_id = ? AND unread = 1`,
        values: [bot_id, user_id],
    });
}
