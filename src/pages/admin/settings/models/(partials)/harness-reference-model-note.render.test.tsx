import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import HarnessReferenceModelNote from "./harness-reference-model-note";

const model = (name: string, input_modalities: string[]) => ({
    id: 1,
    provider_id: 1,
    provider_name: "OpenRouter",
    slug: name.toLowerCase().replace(/ /g, "-"),
    name,
    free: true,
    input_modalities,
});

describe("HarnessReferenceModelNote", () => {
    test("names where a reference call goes when the pick can't take one", () => {
        const html = renderToString(
            <HarnessReferenceModelNote
                model={model("Recraft V4.1", ["text"])}
                reference_model={model("qwen-image-3.0-pro", ["text", "image"])}
            />,
        );

        expect(html).toContain("Recraft V4.1 can");
        expect(html).toContain("reference images");
        expect(html).toContain("qwen-image-3.0-pro");
    });

    test("says a model must be picked when Image editing has none", () => {
        expect(renderToString(<HarnessReferenceModelNote model={model("Recraft", ["text"])} />)).toContain(
            "needs a model picked under Image editing",
        );
    });

    test("says nothing for a model that takes references", () => {
        expect(
            renderToString(<HarnessReferenceModelNote model={model("Gemini Image", ["text", "image"])} />),
        ).toBe("");
    });

    test("says nothing when there's no model to judge", () => {
        expect(renderToString(<HarnessReferenceModelNote />)).toBe("");
    });
});