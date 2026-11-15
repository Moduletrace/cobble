import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import type { TaskWithNames } from "@/src/types";
import shownWorkspaceTasks from "./shown-workspace-tasks";

function task(fields: Partial<TaskWithNames>): TaskWithNames {
    return { id: 1, created_at: 1, updated_at: 2, status: "todo", ...fields };
}

describe("shownWorkspaceTasks", () => {
    test("keeps the workspace-wide tasks before any bot's, then cuts to the cap", () => {
        const tasks = [
            task({ id: 1, bot_id: 3, bot_name: "A", title: "bot 1" }),
            task({ id: 2, workspace_id: 7, title: "wide 1" }),
            task({ id: 3, bot_id: 4, bot_name: "B", title: "bot 2" }),
            task({ id: 4, workspace_id: 7, title: "wide 2" }),
        ];

        expect(shownWorkspaceTasks({ tasks, shown: 3 }).map((it) => it.id)).toEqual([2, 4, 1]);
    });

    test("a list shorter than the cap is left whole", () => {
        const tasks = [task({ id: 1, workspace_id: 7 }), task({ id: 2, bot_id: 3, bot_name: "A" })];

        expect(shownWorkspaceTasks({ tasks }).map((it) => it.id)).toEqual([1, 2]);
    });

    test("the default cap is the app setting", () => {
        const tasks = Array.from({ length: AppData.TaskSectionShown + 3 }, (_, index) =>
            task({ id: index + 1, workspace_id: 7, updated_at: 100 - index }),
        );

        expect(shownWorkspaceTasks({ tasks })).toHaveLength(AppData.TaskSectionShown);
    });

    test("no tasks, nothing to show", () => {
        expect(shownWorkspaceTasks({ tasks: [] })).toEqual([]);
    });
});