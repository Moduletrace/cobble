import { describe, expect, test } from "bun:test";
import nextHarnessModelValue from "./next-harness-model-value";
import type { HarnessFormValue } from "@/src/types";

const base_value: HarnessFormValue = {
    model_id: 10,
    provider_id: 1,
    fallback_model_ids: [11, 12],
    fallback: true,
    enabled: true,
    voice: "george",
    params: { temperature: 0.7, seed: 42 },
    inherit: false,
};

describe("nextHarnessModelValue", () => {
    test("clears generation settings and voice on a model switch", () => {
        const result = nextHarnessModelValue({ value: base_value, model_id: 20 });

        expect(result.model_id).toBe(20);
        expect(result.params).toBeUndefined();
        expect(result.voice).toBeUndefined();
    });

    test("clears them when switching to an automatic pick too", () => {
        const result = nextHarnessModelValue({ value: base_value, model_id: null });

        expect(result.model_id).toBeNull();
        expect(result.params).toBeUndefined();
        expect(result.voice).toBeUndefined();
    });

    test("keeps the rest of the setting", () => {
        const result = nextHarnessModelValue({ value: base_value, model_id: 20 });

        expect(result.provider_id).toBe(1);
        expect(result.fallback_model_ids).toEqual([11, 12]);
        expect(result.fallback).toBe(true);
        expect(result.enabled).toBe(true);
    });
});
