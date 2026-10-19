import BunSQLite from "@moduletrace/bun-sqlite";
import grabMessagesReactions from "./grab-messages-reactions";

type Params = {
    message_id: number;
    user_id: number | string;
    emoji: string;
};

/**
 * Adds a reaction, or takes it back when the user already gave it, and
 * returns the message's fresh reactions.
 */
export default async function toggleMessageReaction({ message_id, user_id, emoji }: Params) {
    const existing = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bot_message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ? LIMIT 1`,
            values: [message_id, user_id, emoji],
        })
    ).payload?.[0];

    if (existing?.id) {
        await BunSQLite.sql({
            sql: `DELETE FROM bot_message_reactions WHERE id = ?`,
            values: [existing.id],
        });
    } else {
        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO bot_message_reactions (created_at, updated_at, message_id, user_id, emoji) VALUES (?, ?, ?, ?, ?)`,
            values: [Date.now(), Date.now(), message_id, user_id, emoji],
        });
    }

    return (await grabMessagesReactions({ message_ids: [message_id], user_id })).get(message_id) || [];
}
