import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessImageOutput, HarnessUsage } from "../types";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";

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
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
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
    workspace_id,
}: Params) {
    const candidates = await resolveHarnessCandidates({ harness: "image", bot_id, workspace_id });

    const { result } = await withCandidates<{ images: HarnessImageOutput[]; usage?: HarnessUsage }>({
        harness: "image",
        candidates,
        on_success: async ({ candidate, result: made }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: "image",
                    candidate,
                    usage: made.usage,
                }),
            }),
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
