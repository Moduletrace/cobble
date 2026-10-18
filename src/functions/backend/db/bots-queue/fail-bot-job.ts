import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import grabLockedBotJob from "./grab-locked-bot-job";
import notifyBotJobFailed from "./notify-bot-job-failed";

type Params = {
    job_id: number | string;
    worker: string;
    error: string;
    /**
     * Retrying won't help (bad parameters, missing access): fail now
     * instead of using the remaining attempts.
     */
    fatal?: boolean;
    /**
     * What to tell the user if the job is out of attempts. Defaults to a
     * short note with the job title and error.
     */
    failure_message?: string;
};

/**
 * Records a failed attempt. The job goes back to the queue with a backoff
 * delay, or, once out of attempts (or `fatal`), is marked failed and the
 * bot tells the user it needs them. Returns the job's new status and the
 * failure notice, if one was sent.
 */
export default async function failBotJob({
    job_id,
    worker,
    error,
    fatal,
    failure_message,
}: Params) {
    const job = await grabLockedBotJob({ job_id, worker });

    if (!job?.id || !job.bot_id) {
        throw new AppError(`This job is no longer held by ${worker}.`);
    }

    if (fatal) {
        await BunSQLite.sql({
            sql: `UPDATE bots_queue SET attempts = MAX(attempts, ?) WHERE id = ?`,
            values: [AppData.BotQueueMaxAttempts, job.id],
        });
    }

    const res = await BunSQLite.queue.fail<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
        table: "bots_queue",
        id: job.id,
        error,
    });

    if (!res.success || !res.singleRes) {
        throw new Error(`Couldn't fail the job: ${res.msg || res.error}`);
    }

    const status = res.singleRes.status;

    if (status != "failed") {
        return { status, notice: null };
    }

    const notice = await notifyBotJobFailed({
        job: res.singleRes,
        failure_message,
    });

    return { status, notice };
}
