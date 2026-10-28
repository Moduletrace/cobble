import type { HarnessCandidate } from "../types";

export type ImageCandidate = {
    candidate: HarnessCandidate;
    /**
     * The harness it was picked for, for its usage row.
     */
    harness: "image" | "image_edit";
};

type Params = {
    /**
     * Whether the call passes reference images.
     */
    references: boolean;
    /**
     * Image generation's candidates.
     */
    image: HarnessCandidate[];
    /**
     * Image editing's setting and candidates; undefined when it's off.
     */
    edit?: {
        /**
         * Whether a model is picked for it.
         */
        picked: boolean;
        fallback: boolean;
        candidates: HarnessCandidate[];
    };
};

/**
 * The models an image call tries, in order. Without references: image
 * generation's. With them: image editing's pick, then (with fallback on)
 * the image generation models that take images; only those while image
 * editing has no usable model or is off. A model that can't take an image
 * is never tried with references, since it would drop them unseen.
 */
export default function orderImageCandidates({ references, image, edit }: Params): ImageCandidate[] {
    if (!references) {
        return image.map((candidate) => ({ candidate, harness: "image" }));
    }

    const takes_images = image
        .filter((candidate) => candidate.model.input_modalities.includes("image"))
        .map((candidate) => ({ candidate, harness: "image" as const }));

    const edits = edit?.picked
        ? edit.candidates.map((candidate) => ({ candidate, harness: "image_edit" as const }))
        : [];

    const ordered = !edits.length
        ? takes_images
        : [...edits, ...(edit?.fallback ? takes_images : [])];

    const seen = new Set<string>();

    return ordered.filter(({ candidate }) => {
        if (seen.has(candidate.key)) return false;
        seen.add(candidate.key);

        return true;
    });
}
