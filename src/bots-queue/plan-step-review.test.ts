import { describe, expect, test } from "bun:test";
import planStepReviewNote from "./plan-step-review";

const plan = { id: 3, title: "Open the shop", current_step: 1, total_steps: 3 };

const note = ({ on_step = true, uses = [], status }: { on_step?: boolean; uses?: { name: string; ok: boolean }[]; status?: "done" | "working" | "blocked" }) =>
    planStepReviewNote({ plan, on_step, tool_uses: uses, status });

describe("planStepReviewNote", () => {
    test("a reply that did not work its step is sent back to it", () => {
        expect(note({ uses: [{ name: "write_file", ok: true }] })).toContain("step 2 of Plan #3");
        expect(note({ uses: [{ name: "write_file", ok: true }] })).toContain("complete_plan_step");
    });

    test("a finished step without its card is sent back for the card", () => {
        const fault = note({ uses: [{ name: "complete_plan_step", ok: true }] });

        expect(fault).toContain("ask_user");
        expect(fault).toContain("Continue to step 3");
        expect(fault).toContain("Pause the plan");
    });

    test("finishing the step and putting the card up passes", () => {
        const uses = [
            { name: "complete_plan_step", ok: true },
            { name: "ask_user", ok: true },
        ];

        expect(note({ uses })).toBeNull();
    });

    test("the last step's card offers to finish the plan", () => {
        const last = { ...plan, current_step: 2 };

        expect(
            planStepReviewNote({
                plan: last,
                on_step: true,
                tool_uses: [{ name: "complete_plan_step", ok: true }],
            }),
        ).toContain("Finish the plan");
    });

    test("a failed finish does not pass", () => {
        expect(note({ uses: [{ name: "complete_plan_step", ok: false }] })).toContain("complete_plan_step");
    });

    test("asking, changing the plan or handing work on ends the step honestly", () => {
        for (const name of ["ask_user", "update_plan", "start_task", "delegate_task", "ask_bot", "hand_over_task"]) {
            expect(note({ uses: [{ name, ok: true }] })).toBeNull();
        }
    });

    test("a reply that says it is blocked or has work coming passes", () => {
        expect(note({ status: "blocked" })).toBeNull();
        expect(note({ status: "working" })).toBeNull();
    });

    test("a reply that is not working a plan step is left alone", () => {
        expect(note({ on_step: false, uses: [{ name: "write_file", ok: true }] })).toBeNull();
    });

    test("a plan with no step left is left alone", () => {
        expect(planStepReviewNote({ plan: { ...plan, current_step: null }, on_step: true, tool_uses: [] })).toBeNull();
    });
});