import type { BUN_SQLITE_COBBLE_CRON_JOBS } from "@/db/types/db";

type Params<T extends BUN_SQLITE_COBBLE_CRON_JOBS> = {
    /**
     * The bot's schedules for this user.
     */
    cron_jobs: T[];
    title: string;
    instructions: string;
    schedule: string;
    /**
     * Where the new one would run: only schedules there can be its twin.
     */
    workspace_id?: number | string | null;
};

const normalize = (text?: string | null) => (text || "").trim().replace(/\s+/g, " ").toLowerCase();

/**
 * The schedule a new one would duplicate, if any: same place and either
 * the same title, or the same timing and brief.
 */
export default function findDuplicateCronJob<T extends BUN_SQLITE_COBBLE_CRON_JOBS>({
    cron_jobs,
    title,
    instructions,
    schedule,
    workspace_id,
}: Params<T>) {
    return (
        cron_jobs.find(
            (cron_job) =>
                Number(cron_job.workspace_id || 0) == Number(workspace_id || 0) &&
                (normalize(cron_job.title) == normalize(title) ||
                    (normalize(cron_job.schedule) == normalize(schedule) &&
                        normalize(cron_job.instructions) == normalize(instructions))),
        ) || null
    );
}
