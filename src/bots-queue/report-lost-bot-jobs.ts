import BunSQLite from "@moduletrace/bun-sqlite";
import grabUnreportedFailedBotJobs from "@/src/functions/backend/db/bots-queue/grab-unreported-failed-bot-jobs";
import notifyBotJobFailed from "@/src/functions/backend/db/bots-queue/notify-bot-job-failed";
import { logError } from "@/src/functions/backend/logger";
import pushBotNotice from "./push-bot-notice";

/**
 * Tells the user about jobs that ran out of attempts by going silent
 * (bun-sqlite fails those itself, without a message), and logs each.
 */
export default async function reportLostBotJobs() {
    const jobs = await grabUnreportedFailedBotJobs();

    for (const job of jobs) {
        if (!job.bot_id) {
            /**
             * A job whose bot was deleted has nobody to tell, but it is
             * stamped all the same: left unstamped, the same rows are read
             * on every poll and never pruned.
             */
            await BunSQLite.sql({
                sql: `UPDATE bots_queue SET finished_at = ? WHERE id = ? AND finished_at IS NULL`,
                values: [Date.now(), Number(job.id)],
            }).catch(() => {});

            continue;
        }

        const notice = await notifyBotJobFailed({
            job,
            failure_message: `I lost track of "${job.title || "the job"}" and couldn't finish it.`,
        });

        await pushBotNotice({ bot_id: job.bot_id, ...notice });

        await logError({
            title: `Bot job #${job.id} lost`,
            error: job.last_error || "The job's lock timed out.",
            details: [
                { label: "Bot", value: job.bot_id },
                { label: "Kind", value: job.kind },
                { label: "Title", value: job.title || "" },
            ],
            metadata: { job_id: job.id, bot_id: job.bot_id, kind: job.kind },
        }).catch(() => {});
    }
}
