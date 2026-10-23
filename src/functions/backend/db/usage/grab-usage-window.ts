import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * How many days back the window starts, today included. Clamped to
     * what the page offers.
     */
    days?: number | string | null;
    /**
     * The moment "now" is, so a whole page (its totals and its days) is
     * read at one instant.
     */
    now?: number;
};

/**
 * The period the usage page totals: a start, an end and the day buckets
 * between them, oldest first, each a local midnight.
 */
export default function grabUsageWindow({ days, now = Date.now() }: Params) {
    const asked = Number(days);
    const count =
        Number.isFinite(asked) && asked > 0
            ? Math.min(Math.round(asked), AppData.UsageMaxDays)
            : AppData.UsageDefaultDays;

    const end = now;
    /**
     * Whole days back from the start of today, so every bucket is a day's
     * work rather than a sliding window's slice.
     */
    const today = startOfDay({ at: now });
    const start = today - (count - 1) * DayMs;

    return {
        days: count,
        start,
        end,
        /**
         * One bucket per day in the window, oldest first.
         */
        buckets: Array.from({ length: count }, (_, index) => start + index * DayMs),
    };
}

export const DayMs = 24 * 60 * 60 * 1000;

/**
 * Local midnight of the day the moment falls in.
 */
export function startOfDay({ at }: { at: number }) {
    const date = new Date(at);

    date.setHours(0, 0, 0, 0);

    return date.getTime();
}
