import { describe, expect, test } from "bun:test";
import guessModelModalities from "./guess-model-modalities";

const outputs = (slug: string) =>
    guessModelModalities({ slug }).output_modalities;

describe("guessModelModalities", () => {
    test("spots speech, transcription, image and embedding models", () => {
        expect(outputs("whisper-large-v3")).toEqual(["transcription"]);
        expect(outputs("gpt-4o-mini-transcribe")).toEqual(["transcription"]);
        expect(outputs("tts-1-hd")).toEqual(["speech"]);
        expect(outputs("gpt-image-1")).toEqual(["image"]);
        expect(outputs("dall-e-3")).toEqual(["image"]);
        expect(outputs("text-embedding-3-small")).toEqual(["embeddings"]);
    });

    test("spots video models, and the ones that take a video to change", () => {
        expect(outputs("sora-2")).toEqual(["video"]);
        expect(outputs("sora-2-pro")).toEqual(["video"]);
        expect(outputs("veo-3.1-generate-preview")).toEqual(["video"]);
        expect(outputs("grok-imagine-video")).toEqual(["video"]);
        expect(outputs("imagen-4.0-generate-001")).toEqual(["image"]);
        expect(outputs("grok-imagine-image")).not.toEqual(["video"]);
        expect(guessModelModalities({ slug: "sora-2" }).input_modalities).toEqual([
            "text",
            "image",
        ]);
        expect(
            guessModelModalities({ slug: "flux-video-edit" }).input_modalities,
        ).toEqual(["text", "image", "video"]);
    });

    test("takes everything else for a tool-calling chat model", () => {
        expect(guessModelModalities({ slug: "deepseek-chat" })).toEqual({
            input_modalities: ["text"],
            output_modalities: ["text"],
            supports_tools: true,
        });
        expect(outputs("mistral-large-latest")).toEqual(["text"]);
    });

    test("knows which chat families see images", () => {
        expect(
            guessModelModalities({ slug: "claude-sonnet-5-5" }).input_modalities,
        ).toEqual(["text", "image"]);
        expect(
            guessModelModalities({ slug: "models/gemini-3.5-flash" })
                .input_modalities,
        ).toEqual(["text", "image"]);
        expect(
            guessModelModalities({ slug: "qwen2.5-vl:7b" }).input_modalities,
        ).toEqual(["text", "image"]);
        expect(
            guessModelModalities({ slug: "deepseek-r1:14b" }).input_modalities,
        ).toEqual(["text"]);
    });
});
