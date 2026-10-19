import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";

type Params = {
    prompt: string;
    n?: number;
    size?: string;
    /**
     * Reference images: https or `data:` URLs.
     */
    references?: string[];
    signal?: AbortSignal;
    /**
     * Uses this bot's image model when it has its own.
     */
    bot_id?: number | string;
};

/**
 * Makes images with the image generation harness. Returns their bytes.
 */
export default async function generateImage({
    prompt,
    n,
    size,
    references,
    signal,
    bot_id,
}: Params) {
    const candidates = await resolveHarnessCandidates({ harness: "image", bot_id });

    const { result } = await withCandidates({
        harness: "image",
        candidates,
        run: async (candidate) =>
            await grabHarnessAdapter({
                kind: candidate.provider.kind,
            }).generateImage({
                candidate,
                prompt,
                n,
                size,
                references,
                signal: signal || new AbortController().signal,
            }),
    });

    return result.images;
}
