import BunSQLite from "@moduletrace/bun-sqlite";
import { toSummary } from "./grab-usage-totals";
import type { TokenUsageSummary } from "@/src/harness/usage/types";

type Params = {
    start: number;
    end: number;
    /**
     * How many the page shows, busiest first.
     */
    limit: number;
};

export type UsageModelRow = {
    /**
     * The provider's own id for the model, as the call recorded it
     * (`deepseek/deepseek-chat`). This is what a person compares, not the
     * catalog row's numeric id.
     */
    model_slug: string;
    /**
     * The catalog's display name, when the model is still listed. A model
     * a provider stopped listing keeps its slug and loses its name.
     */
    model_name: string | null;
    provider_name: string;
    provider_id: number | null;
    harness: string;
} & TokenUsageSummary;

/**
 * Every model the period ran, busiest first (by tokens), with what it
 * spent. This is how one works out what a model costs: its tokens against
 * its calls, for the window asked for.
 */
export default async function grabUsageModels({ start, end, limit }: Params): Promise<UsageModelRow[]> {
    const res = await BunSQLite.sql<{
        model_slug: string | null;
        model_name: string | null;
        provider_name: string | null;
        provider_id: number | null;
        harness: string | null;
        calls: number | null;
        prompt_tokens: number | null;
        completion_tokens: number | null;
        cost: number | null;
    }>({
        sql: `SELECT u.model_slug,
                m.name AS model_name,
                u.provider_name,
                u.provider_id,
                u.harness,
                COUNT(*) AS calls,
                SUM(u.prompt_tokens) AS prompt_tokens,
                SUM(u.completion_tokens) AS completion_tokens,
                SUM(u.cost) AS cost
            FROM token_usages u
            LEFT JOIN harness_models m
                ON m.provider_id = u.provider_id AND m.slug = u.model_slug
            WHERE u.created_at >= ? AND u.created_at < ?
            GROUP BY u.provider_name, u.model_slug, u.harness
            ORDER BY SUM(u.prompt_tokens) + SUM(u.completion_tokens) DESC
            LIMIT ?`,
        values: [start, end, limit],
    });

    return (res.payload || []).map((row) => ({
        model_slug: row.model_slug || "unknown",
        model_name: row.model_name || null,
        provider_name: row.provider_name || "unknown",
        provider_id: row.provider_id == null ? null : Number(row.provider_id),
        harness: String(row.harness || "text"),
        ...toSummary({ row }),
    }));
}
