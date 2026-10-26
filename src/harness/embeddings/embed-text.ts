import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessEmbedResult } from "../types";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";
import fitVectorDimensions from "./fit-vector-dimensions";

type Params = {
    /**
     * The texts to embed, in order. Empty strings are embedded as they
     * are (a provider may refuse them; callers skip empty chunks).
     */
    input: string[];
    signal?: AbortSignal;
    /**
     * Uses this bot's embedding model when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

export type EmbeddingResult = {
    /**
     * One vector per input, `AppData.EmbeddingDimensions` wide, normalized.
     */
    vectors: Float32Array[];
    /**
     * The width the model actually returned, before fitting. Recorded so a
     * change of model is visible.
     */
    model_dimensions: number;
    /**
     * The model that answered (its provider slug), so stored vectors can
     * say where they came from.
     */
    model: string;
};

/**
 * Embeds texts with the embedding harness, fitted to the vector table's
 * fixed width. Throws `HarnessError` when no embedding model is
 * configured or every candidate failed; callers fall back to text
 * matching then.
 */
export default async function embedText({
    input,
    signal,
    bot_id,
    workspace_id,
}: Params): Promise<EmbeddingResult> {
    if (!input.length) return { vectors: [], model_dimensions: 0, model: "" };

    const candidates = await resolveHarnessCandidates({
        harness: "embedding",
        bot_id,
        workspace_id,
    });

    const { result, candidate: answered } = await withCandidates<HarnessEmbedResult>({
        harness: "embedding",
        candidates,
        on_success: async ({ candidate, result: embedded, failed }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: "embedding",
                    candidate,
                    failed,
                    usage: embedded.usage,
                }),
            }),
        run: async (candidate) =>
            await grabHarnessAdapter({ kind: candidate.provider.kind }).embed({
                candidate,
                input,
                signal: signal || new AbortController().signal,
            }),
    });

    return {
        vectors: result.vectors.map((vector) => fitVectorDimensions({ vector })),
        model_dimensions: result.vectors[0]?.length || 0,
        model: answered.model.slug,
    };
}

/**
 * The same for one text, for a search query.
 */
export async function embedQuery({
    text,
    signal,
    bot_id,
    workspace_id,
}: Omit<Params, "input"> & { text: string }) {
    const { vectors } = await embedText({ input: [text], signal, bot_id, workspace_id });

    return vectors[0] as Float32Array;
}
