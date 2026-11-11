import { describe, expect, test } from "bun:test";
import nextHarnessProviderValue from "./next-harness-provider-value";
import type { HarnessFormValue } from "@/src/types";

const base_value: HarnessFormValue = {
    model_id: 10,
    provider_id: 1,
    fallback_model_ids: [11, 12],
    fallback: true,
    enabled: true,
    voice: "george",
    inherit: false,
};

describe("nextHarnessProviderValue", () => {
    test("resets fallback models and clears model when changing to another provider", () => {
        const result = nextHarnessProviderValue({
            value: base_value,
            next: { provider_id: 2, inherit: false },
            picked_provider_id: 1,
        });

        // Model 10 belonged to provider 1, so changing to provider 2 should clear model_id
        expect(result.model_id).toBeNull();
        // Fallback models must be reset to empty array
        expect(result.fallback_model_ids).toEqual([]);
        // Provider must update to 2
        expect(result.provider_id).toBe(2);
        // Voice is cleared
        expect(result.voice).toBeUndefined();
    });

    test("resets fallback models when changing to any provider while keeping model if valid", () => {
        const result = nextHarnessProviderValue({
            value: base_value,
            next: { provider_id: null, inherit: false },
            picked_provider_id: 1,
        });

        // In 'any provider', model 10 is still available
        expect(result.model_id).toBe(10);
        // Fallback models must be reset on provider change
        expect(result.fallback_model_ids).toEqual([]);
        expect(result.provider_id).toBeNull();
    });

    test("resets fallback models when changing from any provider to a specific provider", () => {
        const from_any: HarnessFormValue = {
            ...base_value,
            provider_id: null,
            fallback_model_ids: [15, 16],
        };

        const result = nextHarnessProviderValue({
            value: from_any,
            next: { provider_id: 1, inherit: false },
            picked_provider_id: 1,
        });

        // Model 10 belongs to provider 1, so model_id is kept
        expect(result.model_id).toBe(10);
        // Fallback models must be reset
        expect(result.fallback_model_ids).toEqual([]);
        expect(result.provider_id).toBe(1);
    });

    test("resets fallback models when switching to inherit mode", () => {
        const result = nextHarnessProviderValue({
            value: base_value,
            next: { provider_id: null, inherit: true },
            picked_provider_id: 1,
        });

        expect(result.inherit).toBe(true);
        expect(result.fallback_model_ids).toEqual([]);
    });

    test("keeps fallback models when provider selection has not changed", () => {
        const result = nextHarnessProviderValue({
            value: base_value,
            next: { provider_id: 1, inherit: false },
            picked_provider_id: 1,
        });

        expect(result.model_id).toBe(10);
        expect(result.fallback_model_ids).toEqual([11, 12]);
    });
});
