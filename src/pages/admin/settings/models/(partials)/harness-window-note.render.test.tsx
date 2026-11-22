import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import HarnessWindowNote from "./harness-window-note";

const model = (context_length?: number) => ({
    id: 1,
    provider_id: 10,
    provider_name: "Nvidia Cloud",
    slug: "nvidia/nemotron-3-ultra-550b-a55b",
    name: "nemotron-3-ultra",
    free: false,
    context_length,
});

describe("HarnessWindowNote", () => {
    test("says what a run assumes for a model with no declared window", () => {
        const html = renderToString(<HarnessWindowNote model={model()} />);

        expect(html).toContain("declares no context window");
        expect(html).toContain("1,000,000");
        expect(html).toContain("936,000");
        expect(html).toContain("stops the run with its own limit");
    });

    test("says nothing for a model that declares one", () => {
        expect(renderToString(<HarnessWindowNote model={model(131_072)} />)).toBe("");
    });

    test("says nothing when there's no model to judge", () => {
        expect(renderToString(<HarnessWindowNote />)).toBe("");
    });
});