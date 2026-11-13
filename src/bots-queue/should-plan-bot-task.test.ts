import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import shouldPlanBotTask from "./should-plan-bot-task";

describe("shouldPlanBotTask", () => {
    test("plans a run long enough to repay the plan", () => {
        expect(shouldPlanBotTask({ max_steps: AppData.BotTaskPlanMinSteps })).toBe(true);
        expect(shouldPlanBotTask({ max_steps: AppData.HarnessMaxToolSteps })).toBe(true);
    });

    test("leaves a short run alone: its first turn is its plan", () => {
        expect(shouldPlanBotTask({ max_steps: AppData.BotTaskPlanMinSteps - 1 })).toBe(false);
        expect(shouldPlanBotTask({ max_steps: 1 })).toBe(false);
    });

    test("never plans a chatroom turn", () => {
        expect(shouldPlanBotTask({ max_steps: AppData.HarnessMaxToolSteps, in_chatroom: true })).toBe(false);
    });
});