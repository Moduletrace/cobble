import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotMessageReactionEmoji } from "@/src/dict/bot-dict";
import grabMessagesReactions from "./grab-messages-reactions";

type Params = {
    message_id: number;
    bot_id: number | string;
    /**
     * The user whose conversation it is, so the returned list marks their
     * own reactions.
     */
    user_id: number | string;
    emoji: BotMessageReactionEmoji;
};

/**
 * Adds a bot's reaction to a message (once per emoji) and returns the
 * message's fresh reactions.
 */
export default async function addBotMessageReaction({ message_id, bot_id, user_id, emoji }: Params) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `INSERT OR IGNORE INTO bot_message_reactions (created_at, updated_at, message_id, bot_id, emoji) VALUES (?, ?, ?, ?, ?)`,
        values: [now, now, message_id, bot_id, emoji],
    });

    return (await grabMessagesReactions({ message_ids: [message_id], user_id })).get(
        message_id,
    ) || [];
}
