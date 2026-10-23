import type { CronJobWithNames } from "@/src/types";

/**
 * Replaces one routine in a list with its saved version, keeping the order.
 * Only the row that changed moves, so a pause or an edit never reshuffles
 * the list under the pointer.
 */
export function replaceRoutine({
    routines,
    cron_job,
}: {
    routines: CronJobWithNames[];
    cron_job: CronJobWithNames;
}): CronJobWithNames[] {
    return routines.map((item) => (item.id == cron_job.id ? cron_job : item));
}

/**
 * Drops a deleted routine from a list.
 */
export function dropRoutine({
    routines,
    cron_job_id,
}: {
    routines: CronJobWithNames[];
    cron_job_id: string | number | undefined;
}): CronJobWithNames[] {
    return routines.filter((item) => item.id != cron_job_id);
}
