import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import updateTaskTool from "./update-task-tool";

const tool = updateTaskTool({ user_id: 1, bot_id: 5, is_coordinator: false });

/**
 * The tool's own confines, kept to what needs no database: the rename and
 * brief arguments it accepts and the description that steers a bot to
 * them instead of a second task. The rename itself reaches the DB.
 */
describe("updateTaskTool", () => {
    test("takes a new title and brief", () => {
        expect(tool.schema?.safeParse({ task_id: 20, title: "99designs: contest 1 logo" }).success).toBe(true);
        expect(tool.schema?.safeParse({ task_id: 20, description: "Enter the contest at ..." }).success).toBe(true);
    });

    test("refuses an empty or overlong title", () => {
        expect(tool.schema?.safeParse({ task_id: 20, title: "   " }).success).toBe(false);
        expect(tool.schema?.safeParse({ task_id: 20, title: "x".repeat(AppData.TaskTitleMaxLength + 1) }).success).toBe(
            false,
        );
    });

    test("takes files to unlink, and says how to make room", () => {
        expect(tool.schema?.safeParse({ task_id: 20, unlink_file_ids: [303, 304] }).success).toBe(true);
        expect(tool.description).toContain("unlink_file_ids");
        expect(tool.description).toContain(`holds ${AppData.TaskMediaMaxPerTask} files`);
    });

    test("tells the bot to rename rather than add a second task", () => {
        expect(tool.description).toContain("Rename it with title");
        expect(tool.description).toContain("never create a second task");
    });
});
