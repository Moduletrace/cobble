import type { HarnessCandidate, HarnessUsage } from "../types";
import type { HarnessUsageCall } from "./types";

type Params = {
    harness: HarnessUsageCall["harness"];
    candidate: HarnessCandidate;
    usage?: HarnessUsage;
};

/**
 * The candidate that really answered a call, and what it reported, as the
 * row `recordHarnessUsage` writes. Providers that report no usage at all
 * still get a row (no tokens), so a call is never invisible.
 */
export default function buildUsageCall({ harness, candidate, usage }: Params): HarnessUsageCall {
    return {
        harness,
        provider_id: candidate.provider.id,
        provider_name: candidate.provider.name || candidate.provider.kind,
        model_id: modelIdOf(candidate),
        model_slug: candidate.model.slug,
        prompt_tokens: Number(usage?.prompt_tokens) || 0,
        completion_tokens: Number(usage?.completion_tokens) || 0,
        cost: typeof usage?.cost == "number" && Number.isFinite(usage.cost) ? usage.cost : undefined,
    };
}

/**
 * The `harness_models` row id, when the candidate carries the catalog row
 * it was resolved from (`withCandidates` doesn't drop it; a candidate made
 * by hand may not have one).
 */
function modelIdOf(candidate: HarnessCandidate) {
    const row_id = (candidate.model as { row_id?: number }).row_id;

    return typeof row_id == "number" ? row_id : undefined;
}
