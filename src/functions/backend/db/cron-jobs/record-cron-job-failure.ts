import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    cron_job_id: number;
    /**
     * The run's job: only the schedule's latest run records its failure.
     */
    job_id: number;
    error: string;
};

/**
 * Keeps why a schedule's latest run failed in `last_error`, so Routines
 * shows it. The next run that's queued clears it.
 */
export default async function recordCronJobFailure({ cron_job_id, job_id, error }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE cron_jobs SET last_error = ?, updated_at = ? WHERE id = ? AND last_job_id = ?`,
        values: [`Last run failed: ${error}`, Date.now(), cron_job_id, job_id],
    });
}
