import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import insertBotMessage from "../bots/insert-bot-message";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    /**
     * The worker's report, or why it failed (markdown).
     */
    text: string;
    failed?: boolean;
};

/**
 * Reports a handed-over job back to the bot that handed it over
 * (`requested_by_bot_id`, the coordinator): a message in its conversation
 * with the worker's report, flagged needs-you when the job failed. Returns
 * the message for the live push, or null when nobody handed the job over.
 */
export default async function relayJobToRequester({ job, text, failed }: Params) {
    if (!job.requested_by_bot_id || !job.bot_id || job.requested_by_bot_id == job.bot_id) {
        return null;
    }

    const worker = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT name FROM bots WHERE id = ? LIMIT 1`,
            values: [job.bot_id],
        })
    ).payload?.[0];

    const requester = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT id FROM bots WHERE id = ? LIMIT 1`,
            values: [job.requested_by_bot_id],
        })
    ).payload?.[0];

    if (!requester?.id) return null;

    const name = worker?.name || "A crew member";
    const title = job.title || "the job";

    const message = await insertBotMessage({
        bot_id: requester.id,
        text: failed
            ? `${name} couldn't finish **${title}**. ${text}`.trim()
            : `${name} finished **${title}**. Their report:\n\n${text}`,
        needs_you: failed,
    });

    return { bot_id: requester.id, message };
}
