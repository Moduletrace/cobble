import type { HarnessCandidate, HarnessModelInfo } from "../types";

type Params = {
    /**
     * Image generation's candidates, as resolved.
     */
    image: HarnessCandidate[];
    /**
     * The model the call actually reached.
     */
    tried?: HarnessModelInfo;
};

/**
 * Why a call with a reference image never reached the model the Image
 * setting picked: a model that can't take an image is skipped with
 * references (`orderImageCandidates`), so the call went to Image editing's
 * model instead. Said on the failure, because the bot reports only the model
 * that ran and the user is left thinking its pick was used (Recraft was set
 * a minute before a run spent 29 minutes on the old qwen edit pick).
 */
export default function referenceModelNote({ image, tried }: Params): string | undefined {
    const pinned = image.find((candidate) => candidate.source == "pinned");

    if (!pinned || pinned.model.input_modalities.includes("image")) return undefined;

    return `${pinned.model.name || pinned.model.slug} can't take reference images, so this went to ${
        tried ? tried.name || tried.slug : "another model"
    } instead.`;
}