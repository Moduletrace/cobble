import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import { UnlimitedLimit } from "@/src/utils/run-limit";
import shouldPlanBotTask from "./should-plan-bot-task";

describe("shouldPlanBotTask", () => {
    test("plans a run long enough to repay the plan", () => {
        expect(shouldPlanBotTask({ max_steps: AppData.BotTaskPlanMinSteps })).toBe(true);
        expect(shouldPlanBotTask({ max_steps: 200 })).toBe(true);
    });

    test("always plans a run with no step limit: it has the steps to repay it", () => {
        expect(shouldPlanBotTask({ max_steps: UnlimitedLimit })).toBe(true);
    });

    test("leaves a short run alone: its first turn is its plan", () => {
        expect(shouldPlanBotTask({ max_steps: AppData.BotTaskPlanMinSteps - 1 })).toBe(false);
        expect(shouldPlanBotTask({ max_steps: 1 })).toBe(false);
    });
});