import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessAdapter } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import providerRequest from "./provider-request";

/**
 * Embeddings at the provider's `embeddings_path` (the OpenAI `/embeddings`
 * shape). Batched, since a large file's chunks would otherwise go in one
 * request the provider may refuse.
 */
const embed: HarnessAdapter["embed"] = async ({ candidate, input, signal }) => {
    const { provider, model } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const vectors: number[][] = [];
    /**
     * What the provider said the batch cost. Most report it once per
     * request; the rows are opened before the loop so each batch counts.
     */
    let prompt_tokens = 0;

    /**
     * Every OpenAI-compatible API puts embeddings at `/embeddings`.
     */
    const path = "/embeddings";

    for (let start = 0; start < input.length; start += AppData.EmbeddingBatchSize) {
        const batch = input
            .slice(start, start + AppData.EmbeddingBatchSize)
            .map((text) => text.slice(0, AppData.EmbeddingMaxInputChars));

        const res = await providerRequest({
            provider,
            path,
            json: { model: model.slug, input: batch },
            signal,
            candidate_key: candidate.key,
        });

        const json = await res.json().catch(() => null);
        const items: any[] = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.embeddings)
              ? json.embeddings
              : [];

        if (items.length != batch.length) {
            throw new HarnessError({
                message: `${provider.name || preset.title}: ${items.length} of ${batch.length} texts got a vector.`,
                retryable: true,
                candidate_key: candidate.key,
            });
        }

        prompt_tokens += Number(json?.usage?.prompt_tokens) || 0;

        for (const item of items) {
            const vector = Array.isArray(item) ? item : item?.embedding;

            if (!Array.isArray(vector) || !vector.length) {
                throw new HarnessError({
                    message: `${provider.name || preset.title} sent no embedding back.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            vectors.push(vector.map(Number));
        }
    }

    return {
        vectors,
        ...(prompt_tokens
            ? { usage: { prompt_tokens, completion_tokens: 0 } }
            : {}),
    };
};

export default embed;
