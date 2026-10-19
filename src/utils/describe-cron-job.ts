import type { CronJobWithNames } from "@/src/types";

type Params = {
    cron_job: CronJobWithNames;
};

/**
 * One schedule as a bot reads it: id, title, expression, where it runs,
 * its state and next run (ISO, UTC), and the last error if any.
 */
export default function describeCronJob({ cron_job }: Params) {
    const runs = Number(cron_job.run_count || 0);
    const parts = [
        `#${cron_job.id} "${cron_job.title}"`,
        `\`${cron_job.schedule}\` (UTC)`,
        cron_job.workspace_name ? `in the workspace ${cron_job.workspace_name}` : `in your own chat`,
        cron_job.computer_id ? `on computer ${cron_job.computer_id}` : "",
        cron_job.enabled
            ? cron_job.next_run_at
                ? `next run ${new Date(cron_job.next_run_at).toISOString()}`
                : "no next run"
            : "paused",
        `${runs}${cron_job.max_runs ? ` of ${cron_job.max_runs}` : ""} run${runs == 1 ? "" : "s"} so far`,
        cron_job.last_error ? `last error: ${cron_job.last_error}` : "",
    ];

    return parts.filter(Boolean).join(", ");
}
