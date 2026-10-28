import type { HarnessKind } from "@/src/dict/harness-dict";
import type { HarnessModelInfo } from "../types";

type Params = {
    model: Pick<
        HarnessModelInfo,
        "input_modalities" | "output_modalities" | "supports_tools"
    >;
    harness: HarnessKind;
};

/**
 * Whether a model can do a harness's job:
 * - text: reads and writes text, and calls tools (bots work through tools)
 * - vision: reads images, writes text
 * - transcription: a speech-to-text model (never a chat model that hears
 *   audio: free ones often drop it)
 * - speech: a text-to-speech model
 * - image: makes images
 * - image_edit: makes images from reference images (takes and makes them)
 * - embedding: turns text into vectors (never a chat model)
 */
export default function modelServesHarness({ model, harness }: Params) {
    const input = new Set(model.input_modalities);
    const output = new Set(model.output_modalities);

    switch (harness) {
        case "text":
            return (
                input.has("text") && output.has("text") && model.supports_tools
            );

        case "vision":
            return input.has("image") && output.has("text");

        case "transcription":
            return output.has("transcription");

        case "speech":
            return output.has("speech");

        case "image":
            return output.has("image");

        case "image_edit":
            return input.has("image") && output.has("image");

        case "embedding":
            return output.has("embeddings");
    }
}
