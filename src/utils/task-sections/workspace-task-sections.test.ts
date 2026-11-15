import { describe, expect, test } from "bun:test";
import type { TaskWithNames } from "@/src/types";
import workspaceTaskSections from "./workspace-task-sections";

function task(fields: Partial<TaskWithNames>): TaskWithNames {
    return { id: 1, created_at: 1, updated_at: 2, status: "todo", ...fields };
}

describe("workspaceTaskSections", () => {
    test("the workspace-wide tasks come first, then one section per bot by name", () => {
        const sections = workspaceTaskSections({
            tasks: [
                task({ id: 5, bot_id: 9, bot_name: "SEO Expert", title: "Meta" }),
                task({ id: 2, workspace_id: 3, title: "Ship it" }),
                task({ id: 4, bot_id: 3, bot_name: "Software Engineer", title: "Header" }),
                task({ id: 6, bot_id: 3, bot_name: "Software Engineer", title: "Footer" }),
            ],
        });

        expect(sections.map((section) => section.title)).toEqual([
            "Workspace-wide",
            "SEO Expert",
            "Software Engineer",
        ]);
        expect(sections[1]?.tasks.map((it) => it.id)).toEqual([5]);
        expect(sections[2]?.tasks.map((it) => it.id)).toEqual([4, 6]);
    });

    test("a workspace with no wide task starts with its bots", () => {
        const sections = workspaceTaskSections({ tasks: [task({ id: 4, bot_id: 3, bot_name: "Software Engineer" })] });

        expect(sections.map((section) => section.key)).toEqual(["bot:3"]);
    });

    test("a bot without a name is named by its id", () => {
        const sections = workspaceTaskSections({ tasks: [task({ id: 4, bot_id: 3 })] });

        expect(sections[0]?.title).toBe("Bot 3");
    });

    test("each section is open first, blocked before doing before to do", () => {
        const sections = workspaceTaskSections({
            tasks: [
                task({ id: 1, bot_id: 3, bot_name: "A", status: "done" }),
                task({ id: 2, bot_id: 3, bot_name: "A", status: "todo" }),
                task({ id: 3, bot_id: 3, bot_name: "A", status: "blocked" }),
                task({ id: 4, bot_id: 3, bot_name: "A", status: "doing" }),
            ],
        });

        expect(sections[0]?.tasks.map((it) => it.id)).toEqual([3, 4, 2, 1]);
    });

    test("no tasks, no sections", () => {
        expect(workspaceTaskSections({ tasks: [] })).toEqual([]);
    });
});