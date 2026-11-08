import logEvent from "@/src/functions/backend/logger";
import type HarnessError from "../harness-error";
import type { HarnessCandidate } from "../types";

type Params = {
    harness: string;
    candidate: HarnessCandidate;
    error: HarnessError;
    /**
     * Unix ms it may be tried again, if it rests.
     */
    rests_until?: number;
};

/**
 * Writes a model's failure to the activity log: which model, what the
 * provider said and how long it rests, so a switch to a fallback can be
 * explained afterwards. Once per failure, and a resting model isn't tried,
 * so an outage logs at most once per rest per model. Never throws.
 */
export default async function logCandidateFailure({ harness, candidate, error, rests_until }: Params) {
    const provider = candidate.provider.name || candidate.provider.kind;
    const rest = rests_until
        ? ` It rests for ${Math.max(1, Math.round((rests_until - Date.now()) / 1000))} seconds.`
        : " It isn't benched; the next model takes this call.";

    try {
        await logEvent({
            title: "Model failed",
            category: "llm",
            plain_text: `${candidate.model.slug} on ${provider} failed a ${harness} call (${candidate.source} pick): ${error.message}.${rest}`,
            details: [
                { label: "Model", value: candidate.model.slug },
                { label: "Provider", value: provider },
                { label: "Pick", value: candidate.source },
                { label: "Status", value: error.status ?? "none" },
            ],
            metadata: {
                harness,
                candidate_key: candidate.key,
                source: candidate.source,
                status: error.status,
                retryable: error.retryable,
                provider_wide: error.provider_wide,
                rests_until,
            },
        });
    } catch {}
}
