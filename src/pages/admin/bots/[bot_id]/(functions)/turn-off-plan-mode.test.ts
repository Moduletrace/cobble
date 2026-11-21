import { describe, expect, test } from "bun:test";
import turnOffPlanMode, { PlanModeOffPrompt } from "./turn-off-plan-mode";

function makeHandlers() {
    const modes: boolean[] = [];
    const texts: string[] = [];

    return {
        modes,
        texts,
        set_plan_mode: (on: boolean) => modes.push(on),
        insert_text: (params: { text: string }) => texts.push(params.text),
    };
}

describe("turnOffPlanMode", () => {
    test("turns the conversation's mode off", () => {
        const handlers = makeHandlers();

        turnOffPlanMode({
            set_plan_mode: handlers.set_plan_mode,
            insert_text: handlers.insert_text,
        });

        expect(handlers.modes).toEqual([false]);
    });

    test("puts the next message in the input instead of sending it", () => {
        const handlers = makeHandlers();

        turnOffPlanMode({
            set_plan_mode: handlers.set_plan_mode,
            insert_text: handlers.insert_text,
        });

        expect(handlers.texts).toEqual([PlanModeOffPrompt]);
        expect(PlanModeOffPrompt).toBe("Plan mode is off, go ahead.");
    });
});