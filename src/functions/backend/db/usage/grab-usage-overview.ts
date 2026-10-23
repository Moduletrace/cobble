import { AppData } from "@/src/data/app-data";
import type { UsageOverview } from "@/src/types";
import grabUsageDays from "./grab-usage-days";
import grabUsageModels from "./grab-usage-models";
import grabUsageTotals from "./grab-usage-totals";
import grabUsageWindow, { DayMs } from "./grab-usage-window";

type Params = {
    /**
     * How many days back to total, today included.
     */
    days?: number | string | null;
    now?: number;
};

/**
 * Everything the usage page shows for one window: the totals, the same day
 * by day, per harness and per model, plus the day before the window and a
 * rolling week, so the page can say whether work is going up or down.
 */
export default async function grabUsageOverview({
    days,
    now = Date.now(),
}: Params): Promise<UsageOverview> {
    const window = grabUsageWindow({ days, now });
    const previous_start = window.start - window.days * DayMs;

    const [totals, days_by_day, models, previous, week] = await Promise.all([
        grabUsageTotals({ start: window.start, end: window.end }),
        grabUsageDays({ start: window.start, end: window.end }),
        grabUsageModels({
            start: window.start,
            end: window.end,
            limit: AppData.UsageModelPageSize,
        }),
        grabUsageTotals({ start: previous_start, end: window.start }),
        grabUsageTotals({ start: window.end - 7 * DayMs, end: window.end }),
    ]);

    return {
        window: {
            days: window.days,
            start: window.start,
            end: window.end,
        },
        totals: totals.totals,
        by_harness: totals.by_harness,
        days: days_by_day,
        models,
        previous: previous.totals,
        week: week.totals,
    };
}
