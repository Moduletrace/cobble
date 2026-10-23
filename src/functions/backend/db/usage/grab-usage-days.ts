import BunSQLite from "@moduletrace/bun-sqlite";
import bucketUsageDays, { type UsageDay } from "./bucket-usage-days";

export type { UsageDay };

type Params = {
    start: number;
    end: number;
};

/**
 * One bucket per day in the window, oldest first, each the tokens spent
 * that day. Days with nothing in them are still there, at zero, so the
 * bars keep their spacing.
 *
 * SQLite has no timezone support, so the day is taken with its `localtime`
 * modifier, which reads the same server timezone the page's own day
 * boundaries come from. Grouping by the bare UTC day instead put a late
 * evening's calls in the previous day's bucket, and dropped them whenever
 * no bucket carried that name.
 */
export default async function grabUsageDays({ start, end }: Params): Promise<UsageDay[]> {
    const res = await BunSQLite.sql<{
        local_day: string;
        calls: number | null;
        prompt_tokens: number | null;
        completion_tokens: number | null;
        cost: number | null;
    }>({
        sql: `SELECT date(created_at / 1000, 'unixepoch', 'localtime') AS local_day,
                COUNT(*) AS calls,
                SUM(prompt_tokens) AS prompt_tokens,
                SUM(completion_tokens) AS completion_tokens,
                SUM(cost) AS cost
            FROM token_usages
            WHERE created_at >= ? AND created_at < ?
            GROUP BY local_day`,
        values: [start, end],
    });

    return bucketUsageDays({ rows: res.payload || [], start, end });
}
