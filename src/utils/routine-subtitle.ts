import type { CronJobWithNames } from "@/src/types";
import timeUntil from "./time-until";

type Params = {
    cron_job: CronJobWithNames;
    now?: number;
    /**
     * Shown by default; left out where the conversation already is the
     * bot's (or the workspace's).
     */
    show_bot?: boolean;
    show_workspace?: boolean;
};

/**
 * The line under a routine's name: whose it is, where it runs, its
 * schedule, then when it runs next or why it last couldn't.
 */
export default function routineSubtitle({
    cron_job,
    now = Date.now(),
    show_bot = true,
    show_workspace = true,
}: Params) {
    const next =
        cron_job.enabled && cron_job.next_run_at ? `next ${timeUntil({ at: cron_job.next_run_at, now })}` : "";

    return [
        show_bot ? cron_job.bot_name || "A bot" : "",
        show_workspace ? cron_job.workspace_name || "" : "",
        `${cron_job.schedule} UTC`,
        cron_job.last_error || next,
    ]
        .filter(Boolean)
        .join(" · ");
}
