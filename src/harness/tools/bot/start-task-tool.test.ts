import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import startTaskTool from "./start-task-tool";

const tool = startTaskTool({ user_id: 1, bot_id: 5, session_id: 9, computers: [] });

/**
 * The step budget the queuing bot sets, kept to what needs no database:
 * `runBotTask` caps the run at it, below the install's limit.
 */
describe("startTaskTool", () => {
    test("takes a step budget within the app's limit", () => {
        const brief = { title: "Find the contest", instructions: "Look it up." };

        expect(tool.schema?.safeParse({ ...brief, max_steps: 20 }).success).toBe(true);
        expect(tool.schema?.safeParse(brief).success).toBe(true);
        expect(tool.schema?.safeParse({ ...brief, max_steps: 0 }).success).toBe(false);
        expect(tool.schema?.safeParse({ ...brief, max_steps: AppData.BotStepLimitMax + 1 }).success).toBe(false);
    });
});
