import { describe, expect, test } from "bun:test";
import grabBotPlanTools from "./grab-bot-plan-tools";

/**
 * A run working a plan's step may only work it: writing another plan, or
 * cancelling the one it was woken for, is the user's call on the card. A
 * scheduled run has no card to approve anything on, so its plan starts
 * itself and nothing is left for the bot to cancel. A reply that isn't a
 * step can't finish one either, or the plan would sit active with no card
 * to start the next step from.
 */
const names = (tools: { name: string }[]) => tools.map((tool) => tool.name);

const build = (overrides: Parameters<typeof grabBotPlanTools>[0] | {} = {}) =>
    grabBotPlanTools({
        user_id: 1,
        bot_id: 2,
        session_id: 3,
        workspace_id: null,
        onPlan: () => {},
        ...overrides,
    });

describe("grabBotPlanTools", () => {
    test("a chat reply can write a plan, change it and end it, but not finish a step", () => {
        expect(names(build())).toEqual(["create_plan", "cancel_plan", "update_plan"]);
    });

    test("a run working a step can only change the plan and finish its step", () => {
        expect(names(build({ on_step: true }))).toEqual(["update_plan", "complete_plan_step"]);
    });

    test("a scheduled run writes a plan that's already approved, and can't cancel it", () => {
        expect(names(build({ approve: true }))).toEqual(["create_plan", "update_plan", "complete_plan_step"]);
    });

    test("a plan the app writes shows its card on the message", () => {
        const refs: string[] = [];

        build({ onPlan: ({ ref }) => refs.push(ref) });

        expect(refs).toEqual([]);
    });
});