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
        if (!job.bot_id) continue;

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
