import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import { BotNeedsYouStatusLine } from "@/src/dict/bot-queue-dict";
import insertBotMessage from "../bots/insert-bot-message";
import deleteBotMessage from "../bots/delete-bot-message";
import setBotFace from "../bots/set-bot-face";
import botFaceAfterJob from "./bot-face-after-job";
import grabLockedBotJob from "./grab-locked-bot-job";
import relayJobToRequester from "./relay-job-to-requester";
import recordHookCallResponse from "../bot-hooks/record-hook-call-response";
import noteTrackerTask from "./note-tracker-task";
import jobSessionId from "./job-session-id";
import grabJobUserId from "./grab-job-user-id";
import withMessageUsage from "../usage/with-message-usage";
import attachJobCallsToMessage from "../usage/attach-job-calls-to-message";
import attachJobTracesToMessage from "./attach-job-traces-to-message";
import { logError } from "@/src/functions/backend/logger";
import type { HarnessToolUse } from "@/src/harness/types";
import grabSessionAskId from "../bot-sessions/grab-session-ask-id";
import onAskJobEnded from "../asks/on-ask-job-ended";
import grabSessionHookId from "../bot-hooks/grab-session-hook-id";
import settleInstallRequest from "../install-requests/settle-install-request";
import jobTrackerTaskId from "./job-tracker-task-id";

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
    /**
     * Every tool call the run made, kept on the message.
     */
    tool_log?: HarnessToolUse[];
    /**
     * The tracker tasks the run worked on, linked under the message.
     */
    task_ids?: number[];
    /**
     * The run used every step it was allowed (`BotJobOutcome.exhausted`):
     * a handed-over task it left open is blocked by `noteTrackerTask`, since
     * a run that spent its whole budget and did no work says so itself.
     */
    exhausted?: boolean;
};

/**
 * Marks a job done, closes its task and sends the completion message back
 * to the user in the bot's conversation. Unless it has other jobs open
 * for that user, the bot shows that user needs-you if asked, else done
 * after a task and idle after a reply; with others open, it shows the one
 * still running (a reply in another session mustn't hide a task's row) or
 * waits for one held back by the queue. Nobody else's face changes. A handed-over job's result also goes to the bot that handed
 * it over (`relay`), and a handed-over task left open says so, or is blocked when the run used
 * its whole step budget without finishing (`noteTrackerTask`). A hook
 * run's result is kept on the calls it answered (`recordHookCallResponse`). A job working a crew
 * request ends it (`onAskJobEnded`) and leaves the bot's face alone. Throws if this handler no longer holds the job.
 */
export default async function completeBotJob({
    job_id,
    worker,
    result,
    needs_you,
    silent,
    attachments,
    tool_log,
    task_ids = [],
    exhausted,
}: Params) {
    const job = await grabLockedBotJob({ job_id, worker });

    if (!job?.id || !job.bot_id) {
        throw new AppError(`This job is no longer held by ${worker}.`);
    }

    const now = Date.now();

    /**
     * A handed-over task's run is about that task, whatever its tools did.
     */
    const message_task_ids = [jobTrackerTaskId({ job }), ...task_ids];

    /**
     * The answer is written while this handler still holds the job: with
     * the job marked done first, a throw here reached `failBotJob`, which
     * found the job gone and swallowed it, so the answer was lost with no
     * notice and the bot stayed at working.
     */
    const inserted = silent
        ? null
        : await insertBotMessage({
              bot_id: job.bot_id,
              session_id: await jobSessionId({ job }),
              workspace_id: job.workspace_id || null,
              text: result,
              needs_you,
              media_ids: attachments,
              tool_log,
              task_ids: message_task_ids,
          });

    if (job.id && inserted?.id) {
        await attachJobCallsToMessage({ job_id: job.id, message_id: inserted.id });

        /**
         * What the run did goes with the message it ended in, for its
         * Details modal's debug logs tab.
         */
        await attachJobTracesToMessage({ job_id: job.id, message_id: inserted.id });

        /**
         * Graphics the run made belong to the message it posted.
         */
        await BunSQLite.sql({
            sql: `UPDATE bot_graphics SET message_id = ? WHERE job_id = ? AND message_id IS NULL`,
            values: [inserted.id, job.id],
        }).catch(() => {});
    }

    const res = await BunSQLite.queue.complete({
        table: "bots_queue",
        id: job.id,
    });

    if (!res.success) {
        /**
         * The job never ended, so its answer would sit under a run with no
         * end: it's taken back out (its files stay) and the caller fails
         * the job, which tells the user instead.
         */
        if (inserted?.id) await deleteBotMessage({ message_id: inserted.id }).catch(() => {});

        throw new Error(`Couldn't complete the job: ${res.msg || res.error}`);
    }

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

    /**
     * Pushed live as it is returned, so it carries its usage now: the
     * thread shows the tokens without a reload.
     */
    const message = inserted
        ? ((await withMessageUsage({ messages: [inserted] }).catch(() => [inserted]))[0] ?? inserted)
        : null;

    const user_id = await grabJobUserId({ job });

    /**
     * A hook's run is followed by nobody, so it never shows on the bot's
     * face. A crew request's does: the bot answering it is working.
     */
    const in_hook = Boolean(await grabSessionHookId({ session_id: job.session_id }));

    /**
     * The job is done and its answer saved, so what is left is clearing up:
     * a throw in here is logged rather than failing a job that already
     * ended and holding the answer back from the live push.
     */
    let bot: Awaited<ReturnType<typeof setBotFace>> | null = null;
    let relay: Awaited<ReturnType<typeof relayJobToRequester>> | null = null;

    try {
        bot =
            !user_id || in_hook
                ? null
                : needs_you
                  ? await setBotFace({
                        bot_id: job.bot_id,
                        user_id,
                        face: "needs-you",
                        status_line: BotNeedsYouStatusLine,
                    })
                  : await botFaceAfterJob({ bot_id: job.bot_id, user_id, kind: job.kind });

        await noteTrackerTask({ job, exhausted });

        await recordHookCallResponse({
            job,
            status: "done",
            response: result,
            message_id: inserted?.id,
        });

        relay = silent
            ? null
            : await relayJobToRequester({ job, text: result, task_ids: message_task_ids });

        await onAskJobEnded({ job, text: silent ? "" : result });

        await settleInstallRequest({ job, text: result });
    } catch (error) {
        await logError({
            title: `Bot job #${job.id} completed, its clearing up didn't`,
            error,
        }).catch(() => {});
    }

    return { message, bot, relay };
}
