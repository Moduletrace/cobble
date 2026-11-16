import { describe, expect, test } from "bun:test";
import type { BotPlanView } from "@/src/types";
import botPlanStatusLine from "./bot-plan-status-line";

/**
 * The card's line says where the plan stands and what the user can do, so
 * every state reads differently: a waiting plan asks for approval, a working
 * one says which step, a paused one says how to go on.
 */
const view = (overrides: Partial<BotPlanView>): BotPlanView => ({
    id: 4,
    title: "Audit the pricing pages",
    goal: "",
    steps: [],
    status: "planned",
    current_step: 1,
    finished_steps: 1,
    total_steps: 5,
    decided_at: null,
    created_at: 0,
    updated_at: 0,
    user_id: 1,
    bot_id: 2,
    bot_name: "Scout",
    session_id: 3,
    workspace_id: null,
    ...overrides,
});

describe("botPlanStatusLine", () => {
    test("a waiting plan asks the user to approve or change it", () => {
        expect(botPlanStatusLine({ view: view({ status: "planned" }) })).toBe(
            "Scout wrote this plan. Approve it to start, or change the steps first.",
        );
    });

    test("a working plan names the step it's on, one-based", () => {
        expect(botPlanStatusLine({ view: view({ status: "active", current_step: 1 }) })).toBe(
            "Step 2 of 5: Scout works one step per reply and reports each.",
        );
    });

    test("a paused plan points at picking it back up", () => {
        expect(botPlanStatusLine({ view: view({ status: "paused", current_step: 1 }) })).toContain(
            "Paused at step 2 of 5.",
        );
    });

    test("a finished plan counts the steps behind it", () => {
        expect(botPlanStatusLine({ view: view({ status: "done", current_step: null, finished_steps: 5 }) })).toBe(
            "Every step is done (5 of 5).",
        );
    });

    test("a cancelled plan says where it stopped", () => {
        expect(botPlanStatusLine({ view: view({ status: "cancelled" }) })).toContain("Cancelled at step 2 of 5.");
    });
});