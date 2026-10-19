import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import nextCronRun from "@/src/utils/next-cron-run";
import grabUserCronJob from "./grab-user-cron-job";

type Params = {
    user_id: number | string;
    cron_job_id: number | string;
    /**
     * Only if it's this bot's (a bot managing its own schedules).
     */
    bot_id?: number | string;
    /**
     * Only the fields given are changed. `max_runs: null` runs it until
     * it's stopped.
     */
    data: {
        title?: string;
        instructions?: string;
        schedule?: string;
        enabled?: boolean;
        max_runs?: number | null;
    };
};

/**
 * Changes one of the user's schedules. A new schedule, or turning it back
 * on, counts the next run from now; turning a finished one back on (all
 * its `max_runs` done) starts its count over. Returns the schedule.
 */
export default async function updateCronJob({ user_id, cron_job_id, bot_id, data }: Params) {
    const cron_job = await grabUserCronJob({ user_id, cron_job_id, bot_id });

    const schedule = data.schedule?.trim() || cron_job.schedule || "";
    const schedule_changed = Boolean(data.schedule?.trim()) && schedule != cron_job.schedule;
    const enabled = data.enabled ?? Boolean(cron_job.enabled);
    const turned_on = enabled && !cron_job.enabled;
    const max_runs = data.max_runs === undefined ? cron_job.max_runs || null : data.max_runs;

    const sets: string[] = [];
    const values: (string | number | null)[] = [];

    const set = (field: string, value: string | number | null) => {
        sets.push(`${field} = ?`);
        values.push(value);
    };

    if (data.title !== undefined) set("title", data.title);
    if (data.instructions !== undefined) set("instructions", data.instructions);
    if (data.max_runs !== undefined) set("max_runs", data.max_runs);
    if (data.enabled !== undefined) set("enabled", enabled ? 1 : 0);

    if (schedule_changed || turned_on) {
        const next_run_at = nextCronRun({ schedule, check_interval: schedule_changed });

        if (!next_run_at) {
            throw new AppError(`"${schedule}" never runs.`);
        }

        set("schedule", schedule);
        set("next_run_at", next_run_at);
        set("last_error", null);
    }

    if (turned_on && max_runs && Number(cron_job.run_count || 0) >= max_runs) {
        set("run_count", 0);
    }

    if (!sets.length) return cron_job;

    set("updated_at", Date.now());

    const res = await BunSQLite.sql({
        sql: `UPDATE cron_jobs SET ${sets.join(", ")} WHERE id = ?`,
        values: [...values, cron_job.id!],
    });

    if (!res.success) {
        throw new Error(`Couldn't update the schedule: ${res.error}`);
    }

    return await grabUserCronJob({ user_id, cron_job_id: cron_job.id! });
}
