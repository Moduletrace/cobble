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

    test("a workspace-wide task wears the workspace's picture, or its icon when it has none", () => {
        const pictured = renderToString(
            <TaskListItem
                task={{ ...base_task, title: "Ship it", bot_id: "", workspace_id: 7, workspace_image_media_id: 31 }}
            />,
        );

        expect(pictured).toContain("/media/31/thumbnail");

        const plain = renderToString(<TaskListItem task={{ ...base_task, title: "Ship it", bot_id: "", workspace_id: 7 }} />);

        expect(plain).not.toContain("/media/");
    });

    test("a part says which task it belongs to, and a split task how many parts are open", () => {
        const part = renderToString(
            <TaskListItem task={{ ...base_task, title: "The intro", parent_task_id: 12, parent_title: "Ship it" }} />,
        );

        expect(part).toContain("Part of #12");

        const parent = renderToString(
            <TaskListItem
                task={{ ...base_task, title: "Ship it", bot_id: "", workspace_id: 7, subtask_count: 3, subtask_open_count: 2 }}
            />,
        );

        expect(parent).toContain("2 of 3 parts open");

        const finished = renderToString(
            <TaskListItem
                task={{ ...base_task, title: "Ship it", bot_id: "", workspace_id: 7, subtask_count: 2, subtask_open_count: 0 }}
            />,
        );

        expect(finished).toContain("all 2 parts done");
    });
});