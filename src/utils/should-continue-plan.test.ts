import { describe, expect, test } from "bun:test";
import shouldContinuePlan from "./should-continue-plan";

/**
 * A plan carries on by itself after each step, and stops for a reason that
 * really happened in between: the user was asked something, work was handed
 * off, the plan was paused or ended, it has nothing left to work, or another
 * reply already waits in that conversation. Anything else queues the next
 * step.
 */
const go = {
    status: "active" as const,
    needs_you: false,
    tool_names: ["computer_read_file", "complete_plan_step"],
    plan_session_id: 7,
    session_id: 7,
    has_pending_step: true,
    has_waiting_reply: false,
};

describe("shouldContinuePlan", () => {
    test("carries on once a step finished", () => {
        expect(shouldContinuePlan(go)).toBe(true);
    });

    test("stops while the user is needed", () => {
        expect(shouldContinuePlan({ ...go, needs_you: true })).toBe(false);
    });

    test("stops when the run handed work off, whose report is still to come", () => {
        for (const name of ["start_task", "delegate_task", "ask_bot", "hand_over_task"]) {
            expect(shouldContinuePlan({ ...go, tool_names: [name] })).toBe(false);
        }
    });

    test("stops when the plan was paused or ended mid-step", () => {
        expect(shouldContinuePlan({ ...go, status: "paused" })).toBe(false);
        expect(shouldContinuePlan({ ...go, status: "cancelled" })).toBe(false);
        expect(shouldContinuePlan({ ...go, status: "done" })).toBe(false);
    });

    test("stops once nothing is left to work", () => {
        expect(shouldContinuePlan({ ...go, has_pending_step: false })).toBe(false);
    });

    test("stops when a reply already waits in the conversation", () => {
        expect(shouldContinuePlan({ ...go, has_waiting_reply: true })).toBe(false);
    });

    test("never queues a step into another conversation", () => {
        expect(shouldContinuePlan({ ...go, plan_session_id: "12", session_id: 7 })).toBe(false);
        expect(shouldContinuePlan({ ...go, plan_session_id: "7", session_id: 7 })).toBe(true);
    });
});