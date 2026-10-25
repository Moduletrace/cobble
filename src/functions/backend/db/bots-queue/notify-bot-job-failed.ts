import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import insertBotMessage from "../bots/insert-bot-message";
import setBotFace from "../bots/set-bot-face";
import relayJobToRequester from "./relay-job-to-requester";
import noteTrackerTask from "./note-tracker-task";
import jobSessionId from "./job-session-id";
import grabJobUserId from "./grab-job-user-id";
import { BotNeedsYouStatusLine } from "@/src/dict/bot-queue-dict";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    failure_message?: string;
};

/**
 * Wraps up a job that is out of attempts: stamps `finished_at` (so it's
 * reported once), tells the user in the bot's conversation and sets the
 * bot to needs-you for that user. Its task stays active, since the work isn't done. A
 * handed-over job's failure also goes to the bot that handed it over, and
 * blocks the handed-over task it worked on (`noteTrackerTask`).
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
        session_id: await jobSessionId({ job }),
        workspace_id: job.workspace_id || null,
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

    const user_id = await grabJobUserId({ job });

    const bot = user_id
        ? await setBotFace({
              bot_id: job.bot_id,
              user_id,
              face: "needs-you",
              status_line: BotNeedsYouStatusLine,
          })
        : null;

    await noteTrackerTask({ job, failure: failure_message || job.last_error || "" });

    const relay = await relayJobToRequester({
        job,
        text: failure_message || job.last_error || "",
        failed: true,
    });

    return { message, bot, relay };
}
