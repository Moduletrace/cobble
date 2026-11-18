import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessCandidate } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import providerRequest from "./provider-request";

/**
 * Providers that want `input_type` on every batch, by provider and model:
 * NVIDIA's asymmetric models refuse a batch without it ("'input_type'
 * parameter is required for asymmetric models"), and a custom provider's
 * catalog says nothing about it. The first batch finds out; every later one
 * asks the way the provider wanted from the start.
 */
const wantsInputType = new Set<string>();

const inputTypeKey = ({ provider, model }: HarnessCandidate) =>
    `${provider.base_url}|${model.slug}`;

/**
 * Embeddings at the provider's `embeddings_path` (the OpenAI `/embeddings`
 * shape). Batched, since a large file's chunks would otherwise go in one
 * request the provider may refuse.
 */
const embed: HarnessAdapter["embed"] = async ({ candidate, input, purpose, signal }) => {
    const { provider, model } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const key = inputTypeKey(candidate);
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

        const body = { model: model.slug, input: batch };
        let res: Response;

        try {
            res = await providerRequest({
                provider,
                path,
                json: wantsInputType.has(key) ? { ...body, input_type: purpose } : body,
                signal,
                candidate_key: candidate.key,
            });
        } catch (error) {
            /**
             * The provider says the model embeds a passage and a query
             * differently and wants to be told which. Ask again with it,
             * then remember: only the first batch per provider and model
             * pays for finding out. Any other refusal is the caller's to
             * classify.
             */
            if (
                !(error instanceof HarnessError) ||
                error.status !== 400 ||
                !/input_type/i.test(error.message)
            )
                throw error;

            res = await providerRequest({
                provider,
                path,
                json: { ...body, input_type: purpose },
                signal,
                candidate_key: candidate.key,
            });
            wantsInputType.add(key);
        }

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

        /**
         * Place each vector by the index the provider reports, not by the
         * order it happens to send them in: an out-of-order batch would
         * otherwise pair every text with the wrong vector (M5). A bare
         * array (no index) falls back to its position. A repeated or
         * out-of-range index, or a gap, is a failed batch.
         */
        const batch_vectors: number[][] = new Array(batch.length);
        const seen = new Set<number>();

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const vector = Array.isArray(item) ? item : item?.embedding;

            if (!Array.isArray(vector) || !vector.length) {
                throw new HarnessError({
                    message: `${provider.name || preset.title} sent no embedding back.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            const index =
                !Array.isArray(item) && Number.isInteger(item?.index) ? item.index : i;

            if (index < 0 || index >= batch.length || seen.has(index)) {
                throw new HarnessError({
                    message: `${provider.name || preset.title} sent an embedding index out of range or twice.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            seen.add(index);
            batch_vectors[index] = vector.map(Number);
        }

        for (const vector of batch_vectors) {
            if (!vector) {
                throw new HarnessError({
                    message: `${provider.name || preset.title} left a text without a vector.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }
            vectors.push(vector);
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
