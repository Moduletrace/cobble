import { describe, expect, test } from "bun:test";
import planStepReviewNote from "./plan-step-review";

const plan = { id: 3, title: "Open the shop", current_step: 1 };

const note = ({ on_step = true, uses = [], status }: { on_step?: boolean; uses?: { name: string; ok: boolean }[]; status?: "done" | "working" | "blocked" }) =>
    planStepReviewNote({ plan, on_step, tool_uses: uses, status });

describe("planStepReviewNote", () => {
    test("a reply that did not work its step is sent back to it", () => {
        expect(note({ uses: [{ name: "write_file", ok: true }] })).toContain("step 2 of Plan #3");
        expect(note({ uses: [{ name: "write_file", ok: true }] })).toContain("complete_plan_step");
    });

    test("finishing the step passes", () => {
        expect(note({ uses: [{ name: "complete_plan_step", ok: true }] })).toBeNull();
    });

    test("a failed finish does not pass", () => {
        expect(note({ uses: [{ name: "complete_plan_step", ok: false }] })).toContain("did not finish it");
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