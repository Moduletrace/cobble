import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import HarnessSeesImagesNote from "./harness-sees-images-note";

const model = (input_modalities?: string[]) => ({
    id: 1,
    provider_id: 1,
    provider_name: "Alibaba Cloud Token Plan",
    slug: "qwen3.8-flash",
    name: "qwen3.8-flash",
    free: false,
    input_modalities,
});

describe("HarnessSeesImagesNote", () => {
    test("says a text-only model won't read anything itself", () => {
        const html = renderToString(<HarnessSeesImagesNote model={model(["text"])} />);

        expect(html).toContain("listed as taking text only");
    });

    test("says nothing for a model that takes images", () => {
        const html = renderToString(
            <HarnessSeesImagesNote model={model(["text", "image"])} />,
        );

        expect(html).toBe("");
    });

    test("says nothing when there's no model to judge", () => {
        expect(renderToString(<HarnessSeesImagesNote />)).toBe("");
    });
});
