import { describe, expect, test } from "bun:test";
import type { HarnessCandidate } from "../types";
import orderVideoCandidates from "./order-video-candidates";

function candidate({ slug, input }: { slug: string; input: string[] }): HarnessCandidate {
    return {
        key: `1:${slug}`,
        provider: { id: 1, kind: "openrouter", base_url: "", name: "OpenRouter" } as HarnessCandidate["provider"],
        model: { slug, input_modalities: input, output_modalities: ["video"], supports_tools: false },
        source: "pinned",
    };
}

const text_only = candidate({ slug: "text-only", input: ["text"] });
const veo = candidate({ slug: "veo", input: ["text", "image"] });
const seedance = candidate({ slug: "seedance", input: ["text", "image", "video"] });
const flux_edit = candidate({ slug: "flux-video-edit", input: ["text", "video"] });

function slugs(list: ReturnType<typeof orderVideoCandidates>) {
    return list.map(({ candidate, harness }) => `${harness}:${candidate.model.slug}`);
}

describe("orderVideoCandidates", () => {
    test("from a prompt alone, video generation's models as they are", () => {
        expect(
            slugs(orderVideoCandidates({ images: false, videos: false, video: [text_only, veo] })),
        ).toEqual(["video:text-only", "video:veo"]);
    });

    test("with images, only the models that take them", () => {
        expect(
            slugs(orderVideoCandidates({ images: true, videos: false, video: [text_only, veo] })),
        ).toEqual(["video:veo"]);
    });

    test("a video to change goes to the edit pick, then generation with fallback on", () => {
        const edit = { picked: true, fallback: true, candidates: [flux_edit] };

        expect(
            slugs(orderVideoCandidates({ images: false, videos: true, video: [veo, seedance], edit })),
        ).toEqual(["video_edit:flux-video-edit", "video:seedance"]);
        expect(
            slugs(
                orderVideoCandidates({
                    images: false,
                    videos: true,
                    video: [veo, seedance],
                    edit: { ...edit, fallback: false },
                }),
            ),
        ).toEqual(["video_edit:flux-video-edit"]);
    });

    test("video editing off or unpicked goes to the generation models that take videos", () => {
        expect(
            slugs(orderVideoCandidates({ images: false, videos: true, video: [veo, seedance] })),
        ).toEqual(["video:seedance"]);
        expect(
            slugs(
                orderVideoCandidates({
                    images: false,
                    videos: true,
                    video: [veo, seedance],
                    edit: { picked: false, fallback: true, candidates: [] },
                }),
            ),
        ).toEqual(["video:seedance"]);
    });

    test("an edit pick that can't take the images passed falls to generation", () => {
        expect(
            slugs(
                orderVideoCandidates({
                    images: true,
                    videos: true,
                    video: [veo, seedance],
                    edit: { picked: true, fallback: false, candidates: [flux_edit] },
                }),
            ),
        ).toEqual(["video:seedance"]);
    });
});
