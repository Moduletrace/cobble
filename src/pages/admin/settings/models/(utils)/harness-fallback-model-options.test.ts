import { expect, test } from "bun:test";
import type { HarnessModelOption } from "@/src/types";
import harnessFallbackModelOptions from "./harness-fallback-model-options";

const models: HarnessModelOption[] = [
    { id: 1, provider_id: 10, provider_name: "One", slug: "alpha", name: "Alpha", free: false },
    { id: 2, provider_id: 20, provider_name: "Two", slug: "beta", name: "Beta", free: true },
];

test("offers every model except the ones taken elsewhere", () => {
    const options = harnessFallbackModelOptions({ models, taken: [1] });

    expect(options.map((option) => option.value)).toEqual(["2"]);
    expect(options[0]!.title).toBe("Beta · Two · free");
});

test("names a free model that already says so only once, and marks the pick", () => {
    const options = harnessFallbackModelOptions({
        models: [{ id: 3, provider_id: 10, provider_name: "One", slug: "gamma", name: "Gamma (free)", free: true }],
        model_id: 3,
        taken: [],
    });

    expect(options[0]!.title).toBe("Gamma (free) · One");
    expect(options[0]!.default).toBe(true);
});