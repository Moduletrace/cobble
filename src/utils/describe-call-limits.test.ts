import { describe, expect, test } from "bun:test";
import describeCallLimits from "./describe-call-limits";

describe("describeCallLimits", () => {
    test("names the three limits a run worked under", () => {
        expect(describeCallLimits({ limits: { steps: 60, run_tokens: 250_000, context_tokens: 120_000 } })).toBe(
            "60 steps, 250,000 prompt tokens, 120,000 of context per turn",
        );
    });

    test("leaves out what the call never recorded", () => {
        expect(describeCallLimits({ limits: { steps: 12, run_tokens: null, context_tokens: null } })).toBe("12 steps");
    });

    test("says it was not recorded rather than pretending there was no limit", () => {
        expect(describeCallLimits({ limits: { steps: null, run_tokens: null, context_tokens: null } })).toBe(
            "not recorded",
        );
    });
});