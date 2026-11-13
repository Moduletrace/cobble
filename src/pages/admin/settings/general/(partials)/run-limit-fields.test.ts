import { describe, expect, test } from "bun:test";
import { emptyRunLimitFields, startRunLimitNumber, type RunLimitFieldValue } from "./run-limit-fields";

const every = ({ value = "", unlimited = false }: Partial<RunLimitFieldValue>) => ({
    task_steps: { value, unlimited },
    reply_steps: { value, unlimited },
    unattended_steps: { value, unlimited },
    run_tokens: { value, unlimited },
    context_tokens: { value, unlimited },
    model_rest_seconds: { value, unlimited },
});

describe("emptyRunLimitFields", () => {
    test("names every field whose switch is off with no number in it", () => {
        const values = every({ value: "" });

        expect(emptyRunLimitFields({ values })).toEqual([
            "Tool steps per task",
            "Tool steps per chat reply",
            "Tool steps per routine or hook call",
            "Tokens per run",
            "Working context",
            "Model rest after a failure",
        ]);
    });

    test("a switch that's on needs no number, and a number needs no switch", () => {
        expect(emptyRunLimitFields({ values: every({ unlimited: true }) })).toEqual([]);
        expect(emptyRunLimitFields({ values: every({ value: "250000" }) })).toEqual([]);
    });

    test("a blank field with its switch off is the only thing it reports", () => {
        const values = {
            ...every({ value: "100" }),
            context_tokens: { value: "   ", unlimited: false },
        };

        expect(emptyRunLimitFields({ values })).toEqual(["Working context"]);
    });
});

describe("startRunLimitNumber", () => {
    test("a field with a default shows that default when its switch goes off", () => {
        expect(startRunLimitNumber({ limit: 250_000, ceiling: 100_000_000 })).toBe(250_000);
    });

    test("a default that is itself unlimited leaves the field at the top of its range", () => {
        expect(startRunLimitNumber({ limit: "unlimited", ceiling: 10_000 })).toBe(10_000);
        expect(startRunLimitNumber({ ceiling: 3_600 })).toBe(3_600);
    });
});