import type { HarnessCandidate } from "../types";

/**
 * The `harness_models` row id, when the candidate carries the catalog row
 * it was resolved from (`withCandidates` doesn't drop it; a candidate made
 * by hand may not have one).
 */
export default function candidateModelId({ candidate }: { candidate: HarnessCandidate }) {
    const row_id = (candidate.model as { row_id?: number }).row_id;

    return typeof row_id == "number" ? row_id : undefined;
}
