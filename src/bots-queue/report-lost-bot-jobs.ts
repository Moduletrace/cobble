import grabUnreportedFailedBotJobs from "@/src/functions/backend/db/bots-queue/grab-unreported-failed-bot-jobs";
import notifyBotJobFailed from "@/src/functions/backend/db/bots-queue/notify-bot-job-failed";
import pushBotNotice from "./push-bot-notice";

/**
 * Tells the user about jobs that ran out of attempts by going silent
 * (bun-sqlite fails those itself, without a message).
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
    }
}
