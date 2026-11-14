import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { TaskWithNames } from "@/src/types";
import TaskListItem from "./task-list-item";

const base_task: TaskWithNames = {
    id: 42,
    created_at: 1,
    updated_at: 2,
    bot_id: 3,
    bot_name: "Software Engineer",
    status: "todo",
};

describe("TaskListItem", () => {
    test("appends the task's id to its title, so the list can be matched to a [task:ID]", () => {
        const html = renderToString(<TaskListItem task={{ ...base_task, title: "Fix the header" }} />);

        expect(html).toContain("Fix the header");
        expect(html).toContain("#42");
    });

    test("an untitled task is named by its id alone, never twice", () => {
        const html = renderToString(<TaskListItem task={{ ...base_task, title: "" }} />);

        expect(html).toContain("Task 42");
        expect(html).not.toContain("#42");
    });

    test("a dropped workspace task shows its id too", () => {
        const html = renderToString(
            <TaskListItem task={{ ...base_task, title: "Workspace wide", bot_id: "", workspace_id: 7 }} />,
        );

        expect(html).toContain("Workspace wide");
        expect(html).toContain("#42");
    });
});