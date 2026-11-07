import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import harnessFallbackModelIds from "./harness-fallback-model-ids";

describe("harnessFallbackModelIds", () => {
    test("keeps distinct positive ids in order", () => {
        expect(harnessFallbackModelIds({ options: { fallback_model_ids: [7, "3", 7, -1, 0, 2.5, "x"] } })).toEqual([7, 3]);
    });

    test("caps the list", () => {
        const ids = Array.from({ length: AppData.HarnessTextFallbackModelsMax + 2 }, (_, i) => i + 1);

        expect(harnessFallbackModelIds({ options: { fallback_model_ids: ids } })).toHaveLength(
            AppData.HarnessTextFallbackModelsMax,
        );
    });

    test("is empty without a list", () => {
        expect(harnessFallbackModelIds({ options: {} })).toEqual([]);
        expect(harnessFallbackModelIds({ options: { fallback_model_ids: "1,2" } })).toEqual([]);
        expect(harnessFallbackModelIds({})).toEqual([]);
    });
});
