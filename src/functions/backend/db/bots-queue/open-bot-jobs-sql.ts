import type { SqlCondition } from "@/src/utils/crew-access/types";

type Params = {
    bot_id: number | string;
    /**
     * Only jobs in this user's conversations, never another user's.
     */
    user_id: number | string;
    /**
     * The `bots_queue` alias the condition reads.
     */
    alias?: string;
};

/**
 * The SQL for a bot's jobs for one user that can still run or are running:
 * pending (including one held back with `available_at` until a model comes
 * back) and processing (including one waiting for its computer). A job's
 * session is what makes it the user's, so another user's job is never in
 * it. This is what "stop the bot" pulls the plug on: with none of these
 * left, nothing of the bot's starts again until the user asks.
 */
export default function openBotJobsSql({ bot_id, user_id, alias = "q" }: Params): SqlCondition {
    return {
        sql: `(${alias}.bot_id = ? AND ${alias}.status IN ('pending', 'processing')
            AND ${alias}.session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?))`,
        values: [Number(bot_id), Number(user_id)],
    };
}
