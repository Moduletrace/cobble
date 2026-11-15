import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import findDuplicateTask from "./find-duplicate-task";

function task(fields: Partial<BUN_SQLITE_COBBLE_TASKS>): BUN_SQLITE_COBBLE_TASKS {
    return { id: 1, title: "Check the invoices", status: "todo", ...fields };
}

describe("findDuplicateTask", () => {
    test("finds the open task with the same title in the same bot's list", () => {
        const tasks = [task({ id: 3, bot_id: 2, title: "  check the INVOICES " })];

        expect(findDuplicateTask({ tasks, title: "Check the invoices", bot_id: 2 })?.id).toBe(3);
    });

    test("a finished or cancelled task is never a duplicate", () => {
        const tasks = [
            task({ id: 1, bot_id: 2, status: "done" }),
            task({ id: 2, bot_id: 2, status: "cancelled" }),
        ];

        expect(findDuplicateTask({ tasks, title: "Check the invoices", bot_id: 2 })).toBeNull();
    });

    test("keeps bot lists and workspace lists apart", () => {
        const tasks = [task({ id: 5, bot_id: 2 }), task({ id: 6, workspace_id: 9 })];

        expect(findDuplicateTask({ tasks, title: "Check the invoices", workspace_id: 9 })?.id).toBe(6);
        expect(findDuplicateTask({ tasks, title: "Check the invoices", bot_id: 2 })?.id).toBe(5);
        expect(findDuplicateTask({ tasks, title: "Check the invoices", bot_id: 7 })).toBeNull();
    });

    test("a bot's task in a workspace isn't on its own list, and counts for the whole workspace", () => {
        const tasks = [task({ id: 7, bot_id: 2, workspace_id: 9 })];

        expect(findDuplicateTask({ tasks, title: "Check the invoices", bot_id: 2 })).toBeNull();
        expect(findDuplicateTask({ tasks, title: "Check the invoices", workspace_id: 9, bot_id: 3 })?.id).toBe(7);
    });

    test("two parts of different parents may share a title, the same parent's may not", () => {
        const tasks = [task({ id: 8, bot_id: 2, workspace_id: 9, parent_task_id: 12, title: "Write the intro" })];

        expect(
            findDuplicateTask({ tasks, title: "Write the intro", workspace_id: 9, bot_id: 2, parent_task_id: 12 })?.id,
        ).toBe(8);
        expect(
            findDuplicateTask({ tasks, title: "Write the intro", workspace_id: 9, bot_id: 2, parent_task_id: 13 }),
        ).toBeNull();
        expect(findDuplicateTask({ tasks, title: "Write the intro", workspace_id: 9, bot_id: 2 })).toBeNull();
    });
});
