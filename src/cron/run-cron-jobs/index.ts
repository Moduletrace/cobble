import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CRON_JOBS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import fireCronJob from "@/src/functions/backend/db/cron-jobs/fire-cron-job";

/**
 * Queues the bots' due schedules (`cron_jobs`), oldest due first, at most
 * `AppData.CronJobBatchSize` a tick. A schedule missed while the server
 * was down runs once on the next tick, then carries on from now.
 */
export default async function runCronJobs() {
    const now = Date.now();

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_CRON_JOBS>({
        sql: `SELECT * FROM cron_jobs WHERE enabled = 1 AND next_run_at IS NOT NULL AND next_run_at <= ?
            ORDER BY next_run_at ASC LIMIT ?`,
        values: [now, AppData.CronJobBatchSize],
    });

    for (const cron_job of res.payload || []) {
        await fireCronJob({ cron_job, now });
    }
}
