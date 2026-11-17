import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { BotJobCancelledError } from "@/src/dict/bot-queue-dict";
import AppError from "@/src/utils/app-error";
import { abortRunningJob } from "@/src/bots-queue/job-abort-registry";
import recordHookCallResponse from "../bot-hooks/record-hook-call-response";
import settleInstallRequest from "../install-requests/settle-install-request";
import botFaceAfterJob from "./bot-face-after-job";

type Params = {
    user_id: number | string;
    job_id: number | string;
};

/**
 * Cancels a pending or running job in one of the user's conversations. It's marked failed
 * with `BotJobCancelledError`; a running handler is aborted here and now when
 * this process is the one running it (anywhere else it finds out on its
 * next `updateBotJob`, which returns false) and stops. Its task is closed,
 * and the bot's face for that user is worked out again, so a cancelled run
 * never leaves it showing work that ended.
 */
export default async function cancelBotJob({ user_id, job_id }: Params) {
    const now = Date.now();

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
        sql: `UPDATE bots_queue SET status = 'failed', last_error = ?, locked_at = NULL, locked_by = NULL, finished_at = ?, updated_at = ?
            WHERE id = ? AND status IN ('pending', 'processing')
            AND session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?)
            RETURNING *`,
        values: [BotJobCancelledError, now, now, job_id, user_id],
    });

    const job = res.payload?.[0];

    if (!job?.id) {
        throw new AppError(`No pending or running job to cancel.`);
    }

    if (job.task_id) {
        await BunSQLite.sql({
            sql: `UPDATE bot_tasks SET status = 'done', updated_at = ? WHERE id = ?`,
            values: [now, job.task_id],
        });
    }

    /**
     * What it is waiting on is aborted now, so the run stops writing before
     * the caller goes on: a cancelled run that kept its model call going
     * still wrote its files and its steps.
     */
    abortRunningJob({ job_id: Number(job.id) });

    if (job.bot_id) {
        await botFaceAfterJob({ bot_id: job.bot_id, user_id, kind: job.kind });
    }

    await recordHookCallResponse({ job, status: "failed", response: BotJobCancelledError, now });

    await settleInstallRequest({ job, text: BotJobCancelledError, failed: true });

    return job;
}
