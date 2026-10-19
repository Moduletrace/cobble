import BunSQLite from "@moduletrace/bun-sqlite";
import grabUserCronJob from "./grab-user-cron-job";

type Params = {
    user_id: number | string;
    cron_job_id: number | string;
    /**
     * Only if it's this bot's (a bot managing its own schedules).
     */
    bot_id?: number | string;
};

/**
 * Deletes one of the user's schedules. A run already queued carries on.
 */
export default async function deleteCronJob({ user_id, cron_job_id, bot_id }: Params) {
    const cron_job = await grabUserCronJob({ user_id, cron_job_id, bot_id });

    const res = await BunSQLite.sql({
        sql: `DELETE FROM cron_jobs WHERE id = ?`,
        values: [cron_job.id!],
    });

    if (!res.success) {
        throw new Error(`Couldn't delete the schedule: ${res.error}`);
    }

    return cron_job;
}
