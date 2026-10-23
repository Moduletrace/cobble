import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES, BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { BotJobStoppedError, BotJobStoppedStep } from "@/src/dict/bot-queue-dict";
import insertBotMessage from "../bots/insert-bot-message";
import setBotFace, { type BotFaceChange } from "../bots/set-bot-face";
import { abortRunningJob } from "@/src/bots-queue/job-abort-registry";
import insertBotJobUpdate from "./insert-bot-job-update";
import openBotJobsSql from "./open-bot-jobs-sql";
import stoppedJobReport, { pickReportedJobs } from "./stopped-job-report";

type Params = {
    bot_id: number | string;
    /**
     * Whose conversations stop. Never another user's jobs.
     */
    user_id: number | string;
};

export type StoppedBotJobs = {
    /**
     * The jobs that were open and are now failed as stopped.
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
 * it's on, across all of them) is failed as stopped, its task closed. A
 * running handler finds out on its next `updateBotJob` (which returns
 * false) and drops whatever it was producing. Each job gets a closing
 * step, so a thread's working row says why it went quiet even after a
 * reload, one message per session ends it out loud, and the bot goes
 * idle. It's not a bus: nothing restarts by itself, so a stopped bot
 * works again only when the user asks. A schedule the user set up still
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

    const messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[] = [];

    for (const [session_id, job] of pickReportedJobs({ jobs })) {
        const message = await insertBotMessage({
            bot_id: Number(bot_id),
            session_id,
            workspace_id: job.workspace_id || null,
            text: stoppedJobReport({ job }),
        }).catch(() => null);

        if (message?.id) messages.push(message);
    }

    return {
        jobs,
        messages,
        bot: await setBotFace({ bot_id, user_id, face: "idle" }),
    };
}
