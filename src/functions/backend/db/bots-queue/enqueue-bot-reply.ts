import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import enqueueBotJob from "./enqueue-bot-job";
import { BotReplyJobTitle } from "@/src/dict/bot-queue-dict";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The session the user wrote in.
     */
    session_id: number | string;
    /**
     * The user message to answer.
     */
    message_id: number | string;
    /**
     * Extra job params (`retry_of`, the message whose answer the user
     * asked for again: that run answers afresh instead of finishing silently).
     */
    params?: Record<string, unknown>;
};

/**
 * Queues the bot's chat reply to the user's latest message(s) in a
 * session. A reply reads the session's recent messages when it runs, so a
 * burst of messages shares one reply: while one is still pending in the
 * session, it is reused.
 *
 * A reused job keeps its params, with the new ones laid over them: a
 * pending plan step (`plan_id`) still works its plan, a retry is a retry
 * only while the message that asked for one is still the one being
 * answered, and Plan mode sticks while any of the messages it answers was
 * sent in it (the reply answers them together, so the safest of the two
 * wins: reading only, changing nothing).
 */
export default async function enqueueBotReply({
    user_id,
    bot_id,
    session_id,
    message_id,
    params,
}: Params) {
    const pending = (
        await BunSQLite.sql<Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "id" | "params">>({
            sql: `SELECT id, params FROM bots_queue
                WHERE bot_id = ? AND session_id = ? AND kind = 'reply' AND status = 'pending'
                ORDER BY id DESC LIMIT 1`,
            values: [bot_id, session_id],
        })
    ).payload?.[0];

    if (pending?.id) {
        const previous = parseJobJson({ text: pending.params }) || {};
        const next: Record<string, unknown> = { ...previous, ...params };

        if (previous.plan_mode || params?.plan_mode) {
            next.plan_mode = true;
        } else {
            delete next.plan_mode;
        }

        if (!params || !("retry_of" in params)) delete next.retry_of;

        await BunSQLite.sql({
            sql: `UPDATE bots_queue SET message_id = ?, params = ? WHERE id = ?`,
            values: [message_id, JSON.stringify(next), pending.id],
        });

        return pending.id;
    }

    return await enqueueBotJob({
        kind: "reply",
        user_id,
        bot_id,
        session_id,
        title: BotReplyJobTitle,
        instructions: "Reply to the user's latest messages.",
        message_id,
        params,
    });
}
