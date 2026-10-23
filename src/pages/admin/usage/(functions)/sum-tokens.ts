import type { TokenUsageSummary } from "@/src/harness/usage/types";

type Params = {
    rows: TokenUsageSummary[];
};

/**
 * The tokens every row of a breakdown spent together, which is the
 * denominator of its shares.
 */
export default function sumTokens({ rows }: Params) {
    return rows.reduce((total, row) => total + row.total_tokens, 0);
}
