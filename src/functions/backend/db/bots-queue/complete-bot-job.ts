import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import { BotNeedsYouStatusLine } from "@/src/dict/bot-queue-dict";
import insertBotMessage from "../bots/insert-bot-message";
import setBotFace from "../bots/set-bot-face";
import countOpenBotJobs from "./count-open-bot-jobs";
import grabLockedBotJob from "./grab-locked-bot-job";
import relayJobToRequester from "./relay-job-to-requester";
import jobSessionId from "./job-session-id";
import grabJobUserId from "./grab-job-user-id";
import grabRunningBotJobFace from "./grab-running-bot-job-face";

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
    /**
     * Files the bot saved and asked to send with it (`media` ids).
     */
    attachments?: number[];
};

/**
 * Marks a job done, closes its task and sends the completion message back
 * to the user in the bot's conversation. Unless it has other jobs open
 * for that user, the bot shows that user needs-you if asked, else done
 * after a task and idle after a reply; with others open, it shows the one
 * still running (a reply in another session mustn't hide a task's row).
 * Nobody else's face changes. A handed-over job's result also goes to the bot that handed
 * it over (`relay`). Throws if this handler no longer holds the job.
 */
export default async function completeBotJob({
    job_id,
    worker,
    result,
    needs_you,
    silent,
    attachments,
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
              media_ids: attachments,
          });

    const user_id = await grabJobUserId({ job });

    const bot = !user_id
        ? null
        : needs_you
          ? await setBotFace({
                bot_id: job.bot_id,
                user_id,
                face: "needs-you",
                status_line: BotNeedsYouStatusLine,
            })
          : (await countOpenBotJobs({ bot_id: job.bot_id, user_id }))
            ? await restoreRunningFace({ bot_id: job.bot_id, user_id })
            : await setBotFace({
                  bot_id: job.bot_id,
                  user_id,
                  face: job.kind == "reply" ? "idle" : "done",
              });

    const relay = silent ? null : await relayJobToRequester({ job, text: result });

    return { message, bot, relay };
}

/**
 * Puts back the face of a job still running for the user, if any.
 */
async function restoreRunningFace({ bot_id, user_id }: { bot_id: number; user_id: number }) {
    const running = await grabRunningBotJobFace({ bot_id, user_id });

    return running ? await setBotFace({ bot_id, user_id, ...running }) : null;
}
