import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import insertBotMessage from "../bots/insert-bot-message";
import setBotFace from "../bots/set-bot-face";
import relayJobToRequester from "./relay-job-to-requester";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    failure_message?: string;
};

/**
 * Wraps up a job that is out of attempts: stamps `finished_at` (so it's
 * reported once), tells the user in the bot's conversation and sets the
 * bot to needs-you. Its task stays active, since the work isn't done. A
 * handed-over job's failure also goes to the bot that handed it over.
 */
export default async function notifyBotJobFailed({
    job,
    failure_message,
}: Params) {
    if (!job.id || !job.bot_id) {
        throw new Error(`Job has no id or bot.`);
    }

    await BunSQLite.sql({
        sql: `UPDATE bots_queue SET finished_at = ? WHERE id = ?`,
        values: [Date.now(), job.id],
    });

    const message = await insertBotMessage({
        bot_id: job.bot_id,
        text:
            failure_message ||
            [
                job.kind == "reply"
                    ? `I couldn't reply.`
                    : `I couldn't finish "${job.title || "the job"}".`,
                job.last_error,
            ]
                .filter(Boolean)
                .join(" "),
        needs_you: true,
    });

    const bot = await setBotFace({
        bot_id: job.bot_id,
        face: "needs-you",
        status_line: "Waiting on you",
    });

    const relay = await relayJobToRequester({
        job,
        text: failure_message || job.last_error || "",
        failed: true,
    });

    return { message, bot, relay };
}
