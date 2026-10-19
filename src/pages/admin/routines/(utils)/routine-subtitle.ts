import type { CronJobWithNames } from "@/src/types";
import timeUntil from "@/src/utils/time-until";

type Params = {
    cron_job: CronJobWithNames;
    now?: number;
};

/**
 * The line under a routine's name: whose it is, where it runs, its
 * schedule, then when it runs next or why it last couldn't.
 */
export default function routineSubtitle({ cron_job, now = Date.now() }: Params) {
    const next =
        cron_job.enabled && cron_job.next_run_at ? `next ${timeUntil({ at: cron_job.next_run_at, now })}` : "";

    return [
        cron_job.bot_name || "A bot",
        cron_job.workspace_name || "",
        `${cron_job.schedule} UTC`,
        cron_job.last_error || next,
    ]
        .filter(Boolean)
        .join(" · ");
}
