import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";
import providerRequest from "./provider-request";

type Params = {
    candidate: HarnessCandidate;
    batch: string[];
    purpose: "query" | "passage";
    signal: AbortSignal;
    /**
     * Ask with `input_type` from the first try (this provider already said
     * its model needs it).
     */
    with_input_type: boolean;
};

/**
 * One `/embeddings` request for a batch. A provider that says its model
 * embeds a passage and a query differently (NVIDIA's asymmetric ones) is
 * asked again with `input_type`, and the answer says it was, so the caller
 * can remember and skip the probe next time.
 */
export default async function sendEmbeddingsBatch({
    candidate,
    batch,
    purpose,
    signal,
    with_input_type,
}: Params): Promise<{ res: Response; asked_input_type: boolean }> {
    const { provider, model } = candidate;
    const body = { model: model.slug, input: batch };
    const send = async (json: unknown) =>
        await providerRequest({
            provider,
            path: "/embeddings",
            json,
            signal,
            candidate_key: candidate.key,
        });

    if (with_input_type) {
        return { res: await send({ ...body, input_type: purpose }), asked_input_type: true };
    }

    try {
        return { res: await send(body), asked_input_type: false };
    } catch (error) {
        /**
         * Any other refusal is the caller's to classify.
         */
        if (
            !(error instanceof HarnessError) ||
            error.status !== 400 ||
            !/input_type/i.test(error.message)
        )
            throw error;
    }

    return { res: await send({ ...body, input_type: purpose }), asked_input_type: true };
}