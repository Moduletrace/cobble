import { describe, expect, test } from "bun:test";
import modelServesHarness from "./model-serves-harness";

const chat = {
    input_modalities: ["text"],
    output_modalities: ["text"],
    supports_tools: true,
};

describe("modelServesHarness", () => {
    test("text needs tools", () => {
        expect(modelServesHarness({ model: chat, harness: "text" })).toBe(true);
        expect(
            modelServesHarness({
                model: { ...chat, supports_tools: false },
                harness: "text",
            }),
        ).toBe(false);
    });

    test("vision needs image input", () => {
        expect(modelServesHarness({ model: chat, harness: "vision" })).toBe(
            false,
        );
        expect(
            modelServesHarness({
                model: { ...chat, input_modalities: ["text", "image"] },
                harness: "vision",
            }),
        ).toBe(true);
    });

    test("transcription takes speech-to-text models only", () => {
        expect(
            modelServesHarness({
                model: {
                    input_modalities: ["audio"],
                    output_modalities: ["transcription"],
                    supports_tools: false,
                },
                harness: "transcription",
            }),
        ).toBe(true);
        expect(
            modelServesHarness({
                model: { ...chat, input_modalities: ["text", "audio"] },
                harness: "transcription",
            }),
        ).toBe(false);
        expect(
            modelServesHarness({ model: chat, harness: "transcription" }),
        ).toBe(false);
    });

    test("speech and image need that output", () => {
        expect(
            modelServesHarness({
                model: { ...chat, output_modalities: ["speech"] },
                harness: "speech",
            }),
        ).toBe(true);
        expect(
            modelServesHarness({
                model: { ...chat, output_modalities: ["text", "audio"] },
                harness: "speech",
            }),
        ).toBe(false);
        expect(
            modelServesHarness({
                model: { ...chat, output_modalities: ["image", "text"] },
                harness: "image",
            }),
        ).toBe(true);
    });

    test("image editing takes and makes images", () => {
        expect(
            modelServesHarness({
                model: { ...chat, output_modalities: ["image"] },
                harness: "image_edit",
            }),
        ).toBe(false);
        expect(
            modelServesHarness({
                model: { ...chat, input_modalities: ["text", "image"], output_modalities: ["image"] },
                harness: "image_edit",
            }),
        ).toBe(true);
    });
});
