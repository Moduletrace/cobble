import BunSQLite from "@moduletrace/bun-sqlite";
import type { TokenUsageSummary } from "@/src/harness/usage/types";

type Params = {
    /**
     * The window's start and end (epoch ms), from `grabUsageWindow`.
     */
    start: number;
    end: number;
};

type UsageRow = {
    calls: number | null;
    prompt_tokens: number | null;
    completion_tokens: number | null;
    cost: number | null;
};

/**
 * One total for a whole period, and the same split by the harnesses the
 * calls were for.
 */
export type UsageTotals = {
    totals: TokenUsageSummary;
    by_harness: (TokenUsageSummary & { harness: string })[];
};

/**
 * What every model call in the period cost, in total and per harness
 * (chat, media reading, transcribing, speaking, images, embeddings).
 */
export default async function grabUsageTotals({ start, end }: Params): Promise<UsageTotals> {
    const res = await BunSQLite.sql<UsageRow & { harness: string | null }>({
        sql: `SELECT harness,
                COUNT(*) AS calls,
                SUM(prompt_tokens) AS prompt_tokens,
                SUM(completion_tokens) AS completion_tokens,
                SUM(cost) AS cost
            FROM token_usages
            WHERE created_at >= ? AND created_at < ?
            GROUP BY harness`,
        values: [start, end],
    });

    const by_harness = (res.payload || []).map((row) => ({
        harness: String(row.harness || "text"),
        ...toSummary({ row }),
    }));

    return {
        totals: sumSummary({ summaries: by_harness }),
        by_harness: by_harness.sort((a, b) => b.total_tokens - a.total_tokens),
    };
}

/**
 * Adds summaries into one. A call that reported no tokens still counts as
 * a call.
 */
export function sumSummary({ summaries }: { summaries: TokenUsageSummary[] }): TokenUsageSummary {
    let prompt_tokens = 0;
    let completion_tokens = 0;
    let cost = 0;
    let calls = 0;

    for (const summary of summaries) {
        prompt_tokens += summary.prompt_tokens;
        completion_tokens += summary.completion_tokens;
        cost += summary.cost || 0;
        calls += summary.calls;
    }

    return {
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
        ...(cost > 0 ? { cost } : {}),
        calls,
    };
}

/**
 * One grouped row (any shape with the four sums) as a summary.
 */
export function toSummary({ row }: { row: UsageRow }): TokenUsageSummary {
    const prompt_tokens = Number(row.prompt_tokens) || 0;
    const completion_tokens = Number(row.completion_tokens) || 0;
    const cost = Number(row.cost);

    return {
        prompt_tokens,
        completion_tokens,
        total_tokens: prompt_tokens + completion_tokens,
        ...(Number.isFinite(cost) && cost > 0 ? { cost } : {}),
        calls: Number(row.calls) || 0,
    };
}
