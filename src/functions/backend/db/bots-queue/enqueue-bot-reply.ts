import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import enqueueBotJob from "./enqueue-bot-job";
import { BotReplyJobTitle } from "@/src/dict/bot-queue-dict";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The user message to answer.
     */
    message_id: number | string;
};

/**
 * Queues the bot's chat reply to the user's latest message(s). A reply
 * reads the whole recent conversation when it runs, so a burst of
 * messages shares one reply: while one is still pending, it is reused.
 */
export default async function enqueueBotReply({
    user_id,
    bot_id,
    message_id,
}: Params) {
    const pending = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
            sql: `SELECT id FROM bots_queue
                WHERE bot_id = ? AND kind = 'reply' AND status = 'pending'
                ORDER BY id DESC LIMIT 1`,
            values: [bot_id],
        })
    ).payload?.[0];

    if (pending?.id) {
        await BunSQLite.sql({
            sql: `UPDATE bots_queue SET message_id = ? WHERE id = ?`,
            values: [message_id, pending.id],
        });

        return pending.id;
    }

    return await enqueueBotJob({
        kind: "reply",
        user_id,
        bot_id,
        title: BotReplyJobTitle,
        instructions: "Reply to the user's latest messages.",
        message_id,
    });
}
