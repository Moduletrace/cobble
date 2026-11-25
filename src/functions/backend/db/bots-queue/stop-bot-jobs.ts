import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES, BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { BotJobStoppedError, BotJobStoppedStep } from "@/src/dict/bot-queue-dict";
import insertBotMessage from "../bots/insert-bot-message";
import setBotFace, { type BotFaceChange } from "../bots/set-bot-face";
import { abortRunningJob, requestJobStopSummary } from "@/src/bots-queue/job-abort-registry";
import insertBotJobUpdate from "./insert-bot-job-update";
import recordHookCallResponse from "../bot-hooks/record-hook-call-response";
import openBotJobsSql from "./open-bot-jobs-sql";
import stoppedJobReport, { pickReportedJobs } from "./stopped-job-report";
import grabSessionAskId from "../bot-sessions/grab-session-ask-id";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import stopAsk from "../asks/stop-ask";
import stopAsks from "../asks/stop-asks";
import grabOpenAskBySession from "../asks/grab-open-ask-by-session";
import isUnattendedHookSession from "../bot-hooks/is-unattended-hook-session";
import settleInstallRequest from "../install-requests/settle-install-request";
import attachJobTracesToMessage from "./attach-job-traces-to-message";
import attachJobCallsToMessage from "../usage/attach-job-calls-to-message";
import withMessageUsage from "../usage/with-message-usage";

type Params = {
    bot_id: number | string;
    /**
     * Whose conversations stop. Never another user's jobs.
     */
    user_id: number | string;
};

export type StoppedBotJobs = {
    /**
     * The jobs that were open when the stop came.
     */
    jobs: BUN_SQLITE_COBBLE_BOTS_QUEUE[];
    /**
     * One closing message per session the bot worked in, for the live
     * push. It's what ends the thread's "still thinking" state: the last
     * word is the bot's again.
     */
    messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[];
    /**
     * The user's face change (idle), for the live push.
     */
    bot: BotFaceChange;
};

/**
 * Pulls the plug on a bot for one user: every job of it that could still
 * run or is running in their conversations (replies it still owes, tasks
 * it's on, across all of them) is failed as stopped, its task closed.
 *
 * A run this process is running is asked to stop where it is and write what
 * it did so far (`StoppedRunNote`), and that message is the session's last
 * word. `AppData.BotStopSummaryMs` is all it gets: past that the job is
 * failed and the plain stopped line goes out instead, so a stop never
 * leaves the thread thinking. Each job gets a closing step too, so a
 * thread's working row says why it went quiet even after a reload, and the
 * bot goes idle. It's not a bus: nothing restarts by itself, so a stopped
 * bot works again only when the user asks. A schedule the user set up still
 * comes round, since that is work they asked for.
 */
export default async function stopBotJobs({ bot_id, user_id }: Params): Promise<StoppedBotJobs | null> {
    const condition = openBotJobsSql({ bot_id, user_id });

    const open = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
            sql: `SELECT * FROM bots_queue q WHERE ${condition.sql} ORDER BY q.id ASC`,
            values: condition.values,
        })
    ).payload || [];

    if (!open.length) return null;

    /**
     * The runs this process can still write for are asked to stop and say
     * what they did, one per session (`pickReportedJobs`): that is what the
     * session reads, so a second summary there would stutter.
     */
    const picked = pickReportedJobs({ jobs: open });
    const summarizing: { job_id: number; session_id: number }[] = [];
    const stop_started_at = Date.now();

    for (const [session_id, job] of picked) {
        if (job.status != "processing") continue;
        if (!requestJobStopSummary({ job_id: Number(job.id) })) continue;

        summarizing.push({ job_id: Number(job.id), session_id });
    }

    await waitForStopSummaries({ job_ids: summarizing.map((entry) => entry.job_id) });

    const now = Date.now();
    const jobs: BUN_SQLITE_COBBLE_BOTS_QUEUE[] = [];

    for (const job of open) {
        /**
         * One by one, and only while it's still open: a job that finished
         * on its own between the read and here keeps its result.
         */
        const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
            sql: `UPDATE bots_queue SET status = 'failed', last_error = ?, locked_at = NULL, locked_by = NULL, finished_at = ?, updated_at = ?
                WHERE id = ? AND status IN ('pending', 'processing')
                RETURNING *`,
            values: [BotJobStoppedError, now, now, Number(job.id)],
        });

        const stopped = res.payload?.[0];

        if (!stopped?.id) continue;

        jobs.push(stopped);

        /**
         * If this process is the one running it, stop what it's waiting on
         * now. Anywhere else, the handler finds out on its next heartbeat.
         */
        abortRunningJob({ job_id: Number(stopped.id) });

        if (stopped.task_id) {
            await BunSQLite.sql({
                sql: `UPDATE bot_tasks SET status = 'done', updated_at = ? WHERE id = ?`,
                values: [now, Number(stopped.task_id)],
            });
        }

        await recordHookCallResponse({ job: stopped, status: "failed", response: BotJobStoppedError, now });

        /**
         * A coordinator stopped on an install request: the worker that
         * asked is told.
         */
        await settleInstallRequest({ job: stopped, text: BotJobStoppedError, failed: true });

        /**
         * Recorded as the job's last step, so the working row says why it
         * went quiet.
         */
        try {
            await insertBotJobUpdate({
                job_id: Number(stopped.id),
                bot_id: Number(stopped.bot_id) || Number(bot_id),
                kind: "note",
                text: BotJobStoppedStep,
            });
        } catch {
            /**
             * The step is a courtesy: the job is stopped either way.
             */
        }
    }

    /**
     * A job it was doing for a crew request stops the request: the bot that
     * asked is told, and the other side's run is cancelled. Read from every
     * job that was open, since a run that wrote its own summary is still a
     * stop for the request it was answering.
     */
    const ask_ids = new Set<number>();

    for (const job of open) {
        const from_session = await grabSessionAskId({ session_id: Number(job.session_id) }).catch(
            () => null,
        );

        if (from_session) ask_ids.add(Number(from_session));

        /**
         * An answer runs in the bot's own conversation, so the request it is
         * answering is carried by the job, not by a hidden session.
         */
        const asked = Number(parseJobJson({ text: job.params })?.ask_id) || 0;

        if (asked) ask_ids.add(asked);

        /**
         * A follow-up reply in the answer session carries no `ask_id` of its
         * own: the open request is found by the session it answers in.
         */
        if (!asked && !from_session && job.session_id) {
            const open_ask = await grabOpenAskBySession({ session_id: Number(job.session_id) }).catch(
                () => null,
            );

            if (open_ask?.id) ask_ids.add(Number(open_ask.id));
        }
    }

    for (const ask_id of ask_ids) {
        await stopAsk({
            ask_id,
            reason: "The user stopped the run answering it, so there is no answer.",
        }).catch(() => null);
    }

    /**
     * And the requests a run of its own had open go with it: its bot isn't
     * woken about work the user just stopped.
     */
    await stopAsks({
        user_id,
        requester_bot_id: bot_id,
        session_ids: open.map((job) => Number(job.session_id)),
    }).catch(() => []);

    /**
     * A session whose run wrote its own summary already has its last word.
     */
    const stopped_ids = new Set(jobs.map((job) => Number(job.id)));
    const summarized_sessions = new Set(
        summarizing.filter((entry) => !stopped_ids.has(entry.job_id)).map((entry) => entry.session_id),
    );

    const messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[] = [];

    for (const [session_id, job] of pickReportedJobs({ jobs })) {
        if (summarized_sessions.has(session_id)) continue;

        /**
         * A silent hook's call says it was stopped in its thread
         * (`recordHookCallResponse`), nowhere the user reads.
         */
        if (await isUnattendedHookSession({ session_id })) continue;

        /**
         * A run that wrote its summary just as the wait ran out has its row
         * failed under it: its message is still there, so the plain line
         * would only repeat it.
         */
        const answered = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bot_messages WHERE session_id = ? AND author = 'bot' AND created_at >= ? LIMIT 1`,
                values: [session_id, stop_started_at],
            }).catch(() => null)
        )?.payload?.length;

        if (answered) continue;

        const message = await insertBotMessage({
            bot_id: Number(bot_id),
            session_id,
            workspace_id: job.workspace_id || null,
            text: stoppedJobReport({ job }),
        }).catch(() => null);

        if (message?.id) {
            /**
             * The run's info goes with the message that took its place: its
             * own calls and failures behind the usage chip, and its debug
             * logs, the way a finished run's go with its own.
             */
            await attachJobCallsToMessage({ job_id: Number(job.id), message_id: Number(message.id) });
            await attachJobTracesToMessage({ job_id: Number(job.id), message_id: Number(message.id) });

            messages.push((await withMessageUsage({ messages: [message] }).catch(() => [message]))[0] ?? message);
        }
    }

    return {
        jobs: open,
        messages,
        bot: await setBotFace({ bot_id, user_id, face: "idle" }),
    };
}

/**
 * Waits for the runs asked to summarize to close their rows, never past
 * `AppData.BotStopSummaryMs`: past it the plain stopped line goes out
 * instead. Polled rather than awaited: another process's handler can only
 * be read through the queue.
 */
async function waitForStopSummaries({ job_ids }: { job_ids: number[] }) {
    if (!job_ids.length) return;

    const deadline = Date.now() + AppData.BotStopSummaryMs;
    const placeholders = job_ids.map(() => "?").join(", ");

    while (Date.now() < deadline) {
        const still_open = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bots_queue WHERE id IN (${placeholders}) AND status IN ('pending', 'processing')`,
                values: job_ids,
            }).catch(() => null)
        )?.payload;

        if (!still_open?.length) return;

        await Bun.sleep(250);
    }
}