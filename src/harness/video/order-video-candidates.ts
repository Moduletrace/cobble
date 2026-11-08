import type { HarnessCandidate } from "../types";

export type VideoCandidate = {
    candidate: HarnessCandidate;
    /**
     * The harness it was picked for, for its usage row.
     */
    harness: "video" | "video_edit";
};

type Params = {
    /**
     * Whether the call passes still images (frames or references).
     */
    images: boolean;
    /**
     * Whether it passes videos to change.
     */
    videos: boolean;
    /**
     * Video generation's candidates.
     */
    video: HarnessCandidate[];
    /**
     * Video editing's setting and candidates; undefined when it's off.
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
 * The models a video call tries, in order, as `orderImageCandidates` does
 * for images. Without videos to change: video generation's. With them:
 * video editing's pick, then (with fallback on) the video generation
 * models that take videos; only those while video editing has no model or
 * is off. A model is only tried with what it takes (images, videos), since
 * it would drop the rest unseen.
 */
export default function orderVideoCandidates({ images, videos, video, edit }: Params): VideoCandidate[] {
    const takes = (candidate: HarnessCandidate) => {
        const input = candidate.model.input_modalities;

        return (!images || input.includes("image")) && (!videos || input.includes("video"));
    };

    const generation = video
        .filter(takes)
        .map((candidate) => ({ candidate, harness: "video" as const }));

    if (!videos) return generation;

    const edits = edit?.picked
        ? edit.candidates.filter(takes).map((candidate) => ({ candidate, harness: "video_edit" as const }))
        : [];

    const ordered = !edits.length ? generation : [...edits, ...(edit?.fallback ? generation : [])];
    const seen = new Set<string>();

    return ordered.filter(({ candidate }) => {
        if (seen.has(candidate.key)) return false;
        seen.add(candidate.key);

        return true;
    });
}
