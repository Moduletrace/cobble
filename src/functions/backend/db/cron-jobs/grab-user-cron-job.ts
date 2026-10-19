import AppError from "@/src/utils/app-error";
import grabCronJobs from "./grab-cron-jobs";

type Params = {
    user_id: number | string;
    cron_job_id: number | string;
    /**
     * Only if it's this bot's (a bot managing its own schedules).
     */
    bot_id?: number | string;
};

/**
 * One of the user's schedules. Throws when it isn't theirs (or the bot's).
 */
export default async function grabUserCronJob({ user_id, cron_job_id, bot_id }: Params) {
    const [cron_job] = await grabCronJobs({ user_id, bot_id, cron_job_id });

    if (!cron_job?.id) {
        throw new AppError(`Schedule #${cron_job_id} not found.`);
    }

    return cron_job;
}
