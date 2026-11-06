import { describe, expect, test } from "bun:test";
import deleteTaskTool from "./delete-task-tool";
import grabBotTaskTools from "./grab-bot-task-tools";

/**
 * What needs no database: who gets the tool and what it tells the bot.
 * The delete itself, and its reach checks, reach the DB.
 */
describe("deleteTaskTool", () => {
    test("only a run that may delete gets it", async () => {
        const names = async (can_delete?: boolean) =>
            (await grabBotTaskTools({ user_id: 1, bot_id: 5, is_coordinator: false, can_delete })).map(
                (tool) => tool.name,
            );

        expect(await names(true)).toContain("delete_task");
        expect(await names(false)).not.toContain("delete_task");
        expect(await names()).not.toContain("delete_task");
    });

    test("takes a task id and says cancelling isn't deleting", () => {
        const tool = deleteTaskTool({ user_id: 1, bot_id: 5, is_coordinator: false });

        expect(tool.schema?.safeParse({ task_id: 20 }).success).toBe(true);
        expect(tool.schema?.safeParse({}).success).toBe(false);
        expect(tool.description).toContain("Only when the user asked");
        expect(tool.description).toContain("cancelling isn't deleting");
    });
});
