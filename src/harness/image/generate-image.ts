import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessImageOutput, HarnessUsage } from "../types";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";
import orderImageCandidates from "./order-image-candidates";

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
 * Makes images with the image generation harness, or with image editing
 * when there are reference images (`orderImageCandidates` decides who
 * tries). Returns their bytes.
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
    const has_references = Boolean(references?.length);
    const edit = has_references ? await grabEdit({ bot_id, workspace_id }) : undefined;
    /**
     * Image generation turned off still leaves an image editing pick to
     * work with.
     */
    const image = await resolveHarnessCandidates({ harness: "image", bot_id, workspace_id }).catch(
        (error: unknown) => {
            if (edit?.candidates.length) return [];
            throw error;
        },
    );
    const ordered = orderImageCandidates({ references: has_references, image, edit });

    if (has_references && !ordered.length && image.length) {
        throw new HarnessError({
            message: `None of the image models here takes reference images. A super admin can pick one under Image editing in Settings, under Models.`,
            code: "unavailable",
        });
    }

    const harness_of = new Map(ordered.map(({ candidate, harness }) => [candidate.key, harness]));

    const { result } = await withCandidates<{ images: HarnessImageOutput[]; usage?: HarnessUsage }>({
        harness: edit?.picked ? "image_edit" : "image",
        candidates: ordered.map(({ candidate }) => candidate),
        on_success: async ({ candidate, result: made, failed }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: harness_of.get(candidate.key) || "image",
                    candidate,
                    failed,
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

/**
 * Image editing's setting and candidates, or undefined while it's off.
 */
async function grabEdit({
    bot_id,
    workspace_id,
}: {
    bot_id?: number | string;
    workspace_id?: number | string | null;
}) {
    const setting = await grabHarnessSetting({ harness: "image_edit", bot_id, workspace_id });

    if (!setting.enabled) return undefined;

    return {
        picked: Boolean(setting.model_id),
        fallback: setting.fallback,
        candidates: setting.model_id
            ? await resolveHarnessCandidates({ harness: "image_edit", bot_id, workspace_id })
            : [],
    };
}
