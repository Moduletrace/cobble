import logEvent, { logError } from "@/src/functions/backend/logger";

type Params = {
    title: string;
    schedule: Bun.CronWithAutocomplete;
    task: () => Promise<unknown>;
    run_on_start?: boolean;
    /**
     * Don't log every run (for jobs that run every minute). Errors are
     * still logged.
     */
    quiet?: boolean;
};

/**
 * Registers an in-process `Bun.cron` job. Each run is logged first, and
 * errors are caught and logged so a failing task never crashes the process
 * (Bun.cron rejections otherwise surface as `unhandledRejection`).
 * Schedules are interpreted in UTC.
 */
export default function registerCronJob({
    title,
    schedule,
    task,
    run_on_start,
    quiet,
}: Params) {
    const run = async () => {
        try {
            if (!quiet) {
                await logEvent({
                    title: `Cron: ${title}`,
                    category: "cron",
                    plain_text: `CRON: ${title} ...`,
                });
            }
            await task();
        } catch (error) {
            await logError({
                title: `Cron: ${title} failed`,
                category: "cron",
                error,
            }).catch(() => {});
        }
    };

    if (run_on_start) {
        run();
    }

    return Bun.cron(schedule, run);
}
