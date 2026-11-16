import { describe, expect, test } from "bun:test";
import type { BotPlanStepRecord } from "./parse-bot-plan-steps";
import currentPlanStepIndex from "./current-plan-step-index";
import planStepCounts from "./plan-step-counts";

/**
 * A plan is worked in the order the bot wrote it, so the step to work is
 * always the first one still pending: the app decides it, never the run. A
 * skipped step is behind the plan as much as a done one.
 */
const step = ({ text, state }: { text: string; state: BotPlanStepRecord["state"] }): BotPlanStepRecord => ({
    text,
    state,
    note: "",
});

describe("currentPlanStepIndex", () => {
    test("is the first step still waiting, whatever was skipped before it", () => {
        const steps = [
            step({ text: "Collect the pages", state: "done" }),
            step({ text: "Score them", state: "skipped" }),
            step({ text: "Write it up", state: "pending" }),
            step({ text: "Send it", state: "pending" }),
        ];

        expect(currentPlanStepIndex({ steps })).toBe(2);
    });

    test("is null once nothing is left to work", () => {
        expect(
            currentPlanStepIndex({
                steps: [step({ text: "one", state: "done" }), step({ text: "two", state: "skipped" })],
            }),
        ).toBeNull();
    });

    test("is null for a plan with no steps", () => {
        expect(currentPlanStepIndex({ steps: [] })).toBeNull();
    });
});

describe("planStepCounts", () => {
    test("counts the steps behind the plan, skipped ones included", () => {
        const steps = [
            step({ text: "one", state: "done" }),
            step({ text: "two", state: "skipped" }),
            step({ text: "three", state: "pending" }),
        ];

        expect(planStepCounts({ steps })).toEqual({ finished: 2, total: 3 });
    });
});