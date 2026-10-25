import type { HarnessCandidate, HarnessUsage } from "../types";
import type { HarnessCallSettings, HarnessUsageCall } from "./types";

type Params = {
    harness: HarnessUsageCall["harness"];
    candidate: HarnessCandidate;
    usage?: HarnessUsage;
    /**
     * How the call was made beyond the model: the settings it sent and
     * whose they were. The model's source and the fallback are filled in
     * here.
     */
    settings?: Omit<HarnessCallSettings, "model_source" | "fell_back_from">;
    /**
     * The candidates that failed before this one (`withCandidates`).
     */
    failed?: string[];
};

/**
 * The candidate that really answered a call, and what it reported, as the
 * row `recordHarnessUsage` writes. Providers that report no usage at all
 * still get a row (no tokens), so a call is never invisible. Its settings
 * say how it was made, for a message's details.
 */
export default function buildUsageCall({ harness, candidate, usage, settings, failed }: Params): HarnessUsageCall {
    return {
        harness,
        provider_id: candidate.provider.id,
        provider_name: candidate.provider.name || candidate.provider.kind,
        model_id: modelIdOf(candidate),
        model_slug: candidate.model.slug,
        prompt_tokens: Number(usage?.prompt_tokens) || 0,
        completion_tokens: Number(usage?.completion_tokens) || 0,
        cost: typeof usage?.cost == "number" && Number.isFinite(usage.cost) ? usage.cost : undefined,
        settings: {
            model_source: candidate.source,
            ...settings,
            ...(failed?.length ? { fell_back_from: failed } : {}),
        },
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
