import { DayMs, startOfDay } from "./grab-usage-window";
import { toSummary } from "./grab-usage-totals";
import type { TokenUsageSummary } from "@/src/harness/usage/types";

type Row = {
    /**
     * The day the call was made, `YYYY-MM-DD`, already in local time.
     */
    local_day: string;
    calls: number | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    cost: number | null;
};

type Params = {
    rows: Row[];
    start: number;
    end: number;
};

export type UsageDay = {
    /**
     * The day's local midnight (epoch ms).
     */
    at: number;
    /**
     * `YYYY-MM-DD`, in local time.
     */
    label: string;
} & TokenUsageSummary;

/**
 * The rows SQL grouped by local day, laid onto one bucket per day of the
 * window, oldest first. Days with nothing in them are still there, at
 * zero, so the bars keep their spacing, and every row lands in a bucket:
 * a day outside the window would be a bug in the query's own bounds.
 */
export default function bucketUsageDays({ rows, start, end }: Params): UsageDay[] {
    const by_day = new Map<string, TokenUsageSummary>();

    for (const row of rows) {
        /**
         * Accumulated, not replaced: the query groups by day, so a repeated
         * day means someone asked for two sets of rows, and the later one
         * must add to the earlier rather than hide it.
         */
        const label = String(row.local_day);
        const summary = toSummary({ row });

        by_day.set(label, mergeSummaries({ into: by_day.get(label), summary }));
    }

    const days: UsageDay[] = [];
    const last = startOfDay({ at: end });

    for (let at = startOfDay({ at: start }); at <= last; at += DayMs) {
        const label = localDate({ at });

        days.push({
            at,
            label,
            ...(by_day.get(label) || emptySummary()),
        });
    }

    return days;
}

/**
 * The day a local midnight falls on, in local time.
 *
 * Never `toISOString`: an epoch millisecond read in UTC is a different
 * calendar day for anyone east or west of Greenwich, and a call counted
 * under one day would then look for a bucket named after another and
 * disappear from the chart (which is exactly what it did before).
 */
export function localDate({ at }: { at: number }) {
    const date = new Date(at);

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

function emptySummary(): TokenUsageSummary {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, calls: 0 };
}

/**
 * One summary added onto another. A day that reported no cost still costs
 * nothing; only a real cost is carried, so an unpriced day doesn't turn a
 * priced one into zero.
 */
function mergeSummaries({
    into,
    summary,
}: {
    into?: TokenUsageSummary;
    summary: TokenUsageSummary;
}): TokenUsageSummary {
    const prompt_tokens = (into?.prompt_tokens || 0) + summary.prompt_tokens;
    const completion_tokens = (into?.completion_tokens || 0) + summary.completion_tokens;
    const cost = (into?.cost || 0) + (summary.cost || 0);

    return {
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
        ...(cost > 0 ? { cost } : {}),
        calls: (into?.calls || 0) + summary.calls,
    };
}
