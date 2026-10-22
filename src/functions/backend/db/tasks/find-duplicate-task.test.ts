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
});
