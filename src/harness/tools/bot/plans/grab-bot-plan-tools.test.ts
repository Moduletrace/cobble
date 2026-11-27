import { describe, expect, test } from "bun:test";
import grabBotPlanTools from "./grab-bot-plan-tools";

/**
 * A run working a plan's step may only work it: writing another plan, or
 * cancelling the one it was woken for, is the user's call on the card. Only
 * a reply that writes plans gets create and cancel (`writes_plan`): a task
 * run in a planned conversation is there to work, not to plan. An ordinary
 * attended reply may finish a step when the plan is active and its message
 * asked for it (`can_complete`), since it then ends on the step's card too.
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

    test("a reply whose plan is active can also finish its step", () => {
        expect(names(build({ can_complete: true }))).toEqual([
            "create_plan",
            "cancel_plan",
            "update_plan",
            "complete_plan_step",
        ]);
    });

    test("a run working a step can only change the plan and finish its step", () => {
        expect(names(build({ on_step: true }))).toEqual(["update_plan", "complete_plan_step"]);
    });

    test("a task run picks up the conversation's plan without writing one", () => {
        expect(names(build({ on_step: false, can_complete: true, writes_plan: false }))).toEqual([
            "update_plan",
            "complete_plan_step",
        ]);
    });

    test("a plan the app writes shows its card on the message", () => {
        const refs: string[] = [];

        build({ onPlan: ({ ref }) => refs.push(ref) });

        expect(refs).toEqual([]);
    });
});
