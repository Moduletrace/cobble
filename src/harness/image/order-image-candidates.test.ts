import { describe, expect, test } from "bun:test";
import type { HarnessCandidate } from "../types";
import orderImageCandidates from "./order-image-candidates";

function candidate({ slug, takes_images }: { slug: string; takes_images: boolean }): HarnessCandidate {
    return {
        key: `1:${slug}`,
        provider: { id: 1, kind: "openrouter", base_url: "", name: "OpenRouter" } as HarnessCandidate["provider"],
        model: {
            slug,
            input_modalities: takes_images ? ["text", "image"] : ["text"],
            output_modalities: ["image"],
            supports_tools: false,
        },
        source: "pinned",
    };
}

const flux = candidate({ slug: "flux", takes_images: true });
const recraft = candidate({ slug: "recraft", takes_images: false });
const qwen_edit = candidate({ slug: "qwen-image-edit", takes_images: true });

function slugs(list: ReturnType<typeof orderImageCandidates>) {
    return list.map(({ candidate, harness }) => `${harness}:${candidate.model.slug}`);
}

describe("orderImageCandidates", () => {
    test("without references, image generation's models as they are", () => {
        expect(
            slugs(
                orderImageCandidates({
                    references: false,
                    image: [recraft, flux],
                    edit: { picked: true, fallback: true, candidates: [qwen_edit] },
                }),
            ),
        ).toEqual(["image:recraft", "image:flux"]);
    });

    test("with references and no edit pick, only image models that take images", () => {
        expect(
            slugs(
                orderImageCandidates({
                    references: true,
                    image: [recraft, flux],
                    edit: { picked: false, fallback: true, candidates: [] },
                }),
            ),
        ).toEqual(["image:flux"]);
    });

    test("image editing off goes to image generation", () => {
        expect(
            slugs(orderImageCandidates({ references: true, image: [recraft, flux] })),
        ).toEqual(["image:flux"]);
    });

    test("the edit pick first, then image generation with fallback on", () => {
        expect(
            slugs(
                orderImageCandidates({
                    references: true,
                    image: [flux, recraft],
                    edit: { picked: true, fallback: true, candidates: [qwen_edit] },
                }),
            ),
        ).toEqual(["image_edit:qwen-image-edit", "image:flux"]);
    });

    test("fallback off keeps to the edit pick", () => {
        expect(
            slugs(
                orderImageCandidates({
                    references: true,
                    image: [flux],
                    edit: { picked: true, fallback: false, candidates: [qwen_edit] },
                }),
            ),
        ).toEqual(["image_edit:qwen-image-edit"]);
    });

    test("an edit pick that can't run falls to image generation", () => {
        expect(
            slugs(
                orderImageCandidates({
                    references: true,
                    image: [flux],
                    edit: { picked: true, fallback: false, candidates: [] },
                }),
            ),
        ).toEqual(["image:flux"]);
    });

    test("a model in both lists is tried once, as the edit pick", () => {
        expect(
            slugs(
                orderImageCandidates({
                    references: true,
                    image: [flux],
                    edit: { picked: true, fallback: true, candidates: [flux] },
                }),
            ),
        ).toEqual(["image_edit:flux"]);
    });
});
