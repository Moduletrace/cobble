import { describe, expect, test } from "bun:test";
import type { HarnessCandidate } from "../types";
import referenceModelNote from "./reference-model-note";

const candidate = ({
    slug,
    name,
    modalities,
    source,
}: {
    slug: string;
    name?: string;
    modalities: string[];
    source: HarnessCandidate["source"];
}): HarnessCandidate => ({
    key: `2:${slug}`,
    provider: { id: 2, kind: "custom", base_url: "https://example.test" },
    model: {
        slug,
        name,
        input_modalities: modalities,
        output_modalities: ["image"],
        supports_tools: false,
    },
    source,
});

describe("referenceModelNote", () => {
    test("names the model that ran when the pick can't take a reference", () => {
        const note = referenceModelNote({
            image: [
                candidate({ slug: "recraft-v4.1", name: "Recraft V4.1", modalities: ["text"], source: "pinned" }),
            ],
            tried: {
                slug: "qwen-image-3.0-pro",
                name: "qwen-image-3.0-pro",
                input_modalities: ["text", "image"],
                output_modalities: ["image"],
                supports_tools: false,
            },
        });

        expect(note).toBe(
            "Recraft V4.1 can't take reference images, so this went to qwen-image-3.0-pro instead.",
        );
    });

    test("says nothing when the pick itself takes references", () => {
        expect(
            referenceModelNote({
                image: [
                    candidate({
                        slug: "gemini-image",
                        modalities: ["text", "image"],
                        source: "pinned",
                    }),
                ],
            }),
        ).toBeUndefined();
    });

    test("says nothing when image generation has no pick", () => {
        expect(referenceModelNote({ image: [] })).toBeUndefined();
    });

    test("still says where it went when the model that ran has no name", () => {
        expect(
            referenceModelNote({
                image: [candidate({ slug: "recraft", modalities: ["text"], source: "pinned" })],
                tried: {
                    slug: "qwen-image",
                    input_modalities: ["text", "image"],
                    output_modalities: ["image"],
                    supports_tools: false,
                },
            }),
        ).toBe("recraft can't take reference images, so this went to qwen-image instead.");
    });
});