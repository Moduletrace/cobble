import { AppData } from "@/src/data/app-data";
import AppError from "./app-error";

type Params = {
    /**
     * A Bun.cron expression: 5 fields or a nickname like `@daily`, in UTC.
     */
    schedule: string;
    /**
     * Unix ms to look from (the next run is after it). Defaults to now.
     */
    from?: number;
    /**
     * Refuse schedules that run more often than
     * `AppData.CronJobMinIntervalMs`. Set when a schedule is saved.
     */
    check_interval?: boolean;
};

/**
 * The next run of a schedule after `from`, in unix ms, or null when it
 * never runs again. Throws an `AppError` for an invalid expression (or,
 * with `check_interval`, one that runs too often).
 */
export default function nextCronRun({ schedule, from = Date.now(), check_interval }: Params): number | null {
    const expression = schedule.trim() as Bun.CronWithAutocomplete;
    let next: Date | null;

    try {
        next = Bun.cron.parse(expression, from);
    } catch {
        throw new AppError(
            `"${schedule}" isn't a valid schedule. Use 5 cron fields (minute hour day month weekday, e.g. "0 9 * * MON-FRI") or a nickname like @daily.`,
        );
    }

    if (!next) return null;

    if (check_interval) {
        const after = Bun.cron.parse(expression, next);

        if (after && after.getTime() - next.getTime() < AppData.CronJobMinIntervalMs) {
            throw new AppError(
                `"${schedule}" runs too often. Leave at least ${Math.round(AppData.CronJobMinIntervalMs / 60000)} minutes between runs.`,
            );
        }
    }

    return next.getTime();
}
