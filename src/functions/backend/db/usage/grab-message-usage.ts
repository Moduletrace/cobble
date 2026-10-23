import BunSQLite from "@moduletrace/bun-sqlite";
import type { TokenUsageSummary } from "@/src/harness/usage/types";

type Params = {
    /**
     * The messages whose calls are summed. A message with no calls is
     * absent from the answer.
     */
    message_ids: number[];
};

/**
 * What each of these messages cost, summed over every model call it took
 * (chat turns, media readings, image generations). This is what a
 * message's token line shows.
 */
export default async function grabMessageUsage({ message_ids }: Params) {
    const totals = new Map<number, TokenUsageSummary>();
    const ids = [...new Set(message_ids.map(Number).filter((id) => id > 0))];

    if (!ids.length) return totals;

    const res = await BunSQLite.sql<{
        message_id: number;
        prompt_tokens: number | null;
        completion_tokens: number | null;
        cost: number | null;
        calls: number;
    }>({
        sql: `SELECT message_id,
                SUM(prompt_tokens) AS prompt_tokens,
                SUM(completion_tokens) AS completion_tokens,
                SUM(cost) AS cost,
                COUNT(*) AS calls
            FROM token_usages
            WHERE message_id IN (${ids.map(() => "?").join(", ")})
            GROUP BY message_id`,
        values: ids,
    });

    for (const row of res.payload || []) {
        const prompt_tokens = Number(row.prompt_tokens) || 0;
        const completion_tokens = Number(row.completion_tokens) || 0;
        const cost = Number(row.cost);

        totals.set(Number(row.message_id), {
            prompt_tokens,
            completion_tokens,
            total_tokens: prompt_tokens + completion_tokens,
            ...(Number.isFinite(cost) && cost > 0 ? { cost } : {}),
            calls: Number(row.calls) || 0,
        });
    }

    return totals;
}
