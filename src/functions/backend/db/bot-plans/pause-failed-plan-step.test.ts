import { describe, expect, test } from "bun:test";
import parseBotPlanSteps from "@/src/utils/parse-bot-plan-steps";
import { reopenWorkedPlanStep } from "./pause-failed-plan-step";

/**
 * A run that finished a plan step and then never delivered its report must
 * leave that step to work again, not a card showing it done and offering the
 * step after it.
 */
describe("reopenWorkedPlanStep", () => {
    const steps = parseBotPlanSteps({
        text: JSON.stringify([
            { text: "Collect", state: "done", note: "14 pages", done_job_id: 700 },
            { text: "Score", state: "done", note: "8 kept", done_job_id: 701 },
            { text: "Write", state: "pending", note: "" },
        ]),
    });

    test("puts back the step that run finished, with its note kept", () => {
        const { steps: reopened, reopened: changed } = reopenWorkedPlanStep({ steps, job_id: 701 });

        expect(changed).toBe(true);
        expect(reopened.map((step) => step.state)).toEqual(["done", "pending", "pending"]);
        expect(reopened[1]?.note).toBe("8 kept");
        /**
         * The step before it, delivered by another run, is untouched.
         */
        expect(reopened[0]).toEqual(steps[0]);
    });

    test("a run that finished no step changes nothing", () => {
        const { steps: same, reopened } = reopenWorkedPlanStep({ steps, job_id: 999 });

        expect(reopened).toBe(false);
        expect(same).toBe(steps);
    });

    test("a step written before the run was recorded is left done", () => {
        const older = parseBotPlanSteps({ text: JSON.stringify([{ text: "Collect", state: "done", note: "14" }]) });
        const { steps: same, reopened } = reopenWorkedPlanStep({ steps: older, job_id: 700 });

        expect(reopened).toBe(false);
        expect(same.map((step) => step.state)).toEqual(["done"]);
    });
});
