import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessCandidate } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import sendEmbeddingsBatch from "./send-embeddings-batch";
import smallerBatchLimit from "./smaller-batch-limit";

/**
 * Providers that want `input_type` on every batch, by provider and model:
 * NVIDIA's asymmetric models refuse a batch without it ("'input_type'
 * parameter is required for asymmetric models"), and a custom provider's
 * catalog says nothing about it. The first batch finds out; every later one
 * asks the way the provider wanted from the start.
 */
const wantsInputType = new Set<string>();

/**
 * The largest batch a provider and model already refused a bigger one over.
 * Alibaba's Model Studio caps a batch at 20 and refuses the whole request, so
 * the size it named is remembered for the process: every later document goes
 * straight to a batch that fits instead of paying for the refusal again.
 */
const batchLimits = new Map<string, number>();

const inputTypeKey = ({ provider, model }: HarnessCandidate) =>
    `${provider.base_url}|${model.slug}`;

/**
 * Embeddings at the provider's `embeddings_path` (the OpenAI `/embeddings`
 * shape). Batched, since a large file's chunks would otherwise go in one
 * request the provider may refuse.
 */
const embed: HarnessAdapter["embed"] = async ({ candidate, input, purpose, signal }) => {
    const { provider } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const key = inputTypeKey(candidate);
    const vectors: number[][] = [];
    /**
     * What the provider said the batch cost. Most report it once per
     * request; the rows are opened before the loop so each batch counts.
     */
    let prompt_tokens = 0;

    /**
     * The batch size in use: the install's, or the smaller one this provider
     * and model already made clear it wants.
     */
    let limit = batchLimits.get(key) || AppData.EmbeddingBatchSize;

    for (let start = 0; start < input.length; ) {
        const batch = input
            .slice(start, start + limit)
            .map((text) => text.slice(0, AppData.EmbeddingMaxInputChars));

        let res: Response;

        try {
            const sent = await sendEmbeddingsBatch({
                candidate,
                batch,
                purpose,
                signal,
                with_input_type: wantsInputType.has(key),
            });

            if (sent.asked_input_type) wantsInputType.add(key);

            res = sent.res;
        } catch (error) {
            /**
             * A provider may cap a batch below the install's size (Alibaba's
             * Model Studio: "batch size is invalid, it should not be larger
             * than 20"). Nothing of this batch was stored, so retry it whole
             * at the smaller size, and keep that size for the rest of the
             * run. Only a size refusal is retried; anything else is the
             * caller's to classify.
             */
            const smaller = smallerBatchLimit({ error, size: batch.length });

            if (smaller === null) throw error;

            limit = smaller;
            batchLimits.set(key, smaller);
            continue;
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

        start += batch.length;
    }

    return {
        vectors,
        ...(prompt_tokens
            ? { usage: { prompt_tokens, completion_tokens: 0 } }
            : {}),
    };
};

export default embed;
