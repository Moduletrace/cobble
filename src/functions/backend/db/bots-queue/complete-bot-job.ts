import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import insertBotMessage from "../bots/insert-bot-message";
import setBotFace from "../bots/set-bot-face";
import countOpenBotJobs from "./count-open-bot-jobs";
import grabLockedBotJob from "./grab-locked-bot-job";
import relayJobToRequester from "./relay-job-to-requester";
import jobSessionId from "./job-session-id";

type Params = {
    job_id: number | string;
    worker: string;
    /**
     * The completion message for the user (markdown). Also kept as the
     * job's `result`.
     */
    result: string;
    /**
     * Flag the message as needing the user.
     */
    needs_you?: boolean;
    /**
     * Finish without posting a message.
     */
    silent?: boolean;
};

/**
 * Marks a job done, closes its task and sends the completion message back
 * to the user in the bot's conversation. Unless it has other jobs open,
 * the bot shows needs-you if asked, else done after a task and idle after
 * a reply. A handed-over job's result also goes to the bot that handed
 * it over (`relay`). Throws if this handler no longer holds the job.
 */
export default async function completeBotJob({
    job_id,
    worker,
    result,
    needs_you,
    silent,
}: Params) {
    const job = await grabLockedBotJob({ job_id, worker });

    if (!job?.id || !job.bot_id) {
        throw new AppError(`This job is no longer held by ${worker}.`);
    }

    const res = await BunSQLite.queue.complete({
        table: "bots_queue",
        id: job.id,
    });

    if (!res.success) {
        throw new Error(`Couldn't complete the job: ${res.msg || res.error}`);
    }

    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE bots_queue SET result = ?, finished_at = ? WHERE id = ?`,
        values: [result, now, job.id],
    });

    if (job.task_id) {
        await BunSQLite.sql({
            sql: `UPDATE bot_tasks SET status = 'done', updated_at = ? WHERE id = ?`,
            values: [now, job.task_id],
        });
    }

    const message = silent
        ? null
        : await insertBotMessage({
              bot_id: job.bot_id,
              session_id: await jobSessionId({ job }),
              workspace_id: job.workspace_id || null,
              text: result,
              needs_you,
          });

    const bot = needs_you
        ? await setBotFace({
              bot_id: job.bot_id,
              face: "needs-you",
              status_line: "Waiting on you",
          })
        : (await countOpenBotJobs({ bot_id: job.bot_id }))
          ? null
          : await setBotFace({
                bot_id: job.bot_id,
                face: job.kind == "reply" ? "idle" : "done",
            });

    const relay = silent ? null : await relayJobToRequester({ job, text: result });

    return { message, bot, relay };
}
