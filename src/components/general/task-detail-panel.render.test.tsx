import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { AppData } from "@/src/data/app-data";
import type { TaskDetail } from "@/src/types";
import TaskDetailPanel from "./task-detail-panel";

function detail(fields: Partial<TaskDetail>): TaskDetail {
    return {
        id: 12,
        created_at: 1,
        updated_at: 2,
        title: "Ship the release",
        status: "doing",
        notes: [],
        files: [],
        subtasks: [],
        ...fields,
    };
}

const noop = () => {};

describe("TaskDetailPanel", () => {
    test("a split workspace-wide task lists its subtasks with how many are still open", () => {
        const html = renderToString(
            <TaskDetailPanel
                task={detail({
                    bot_id: "",
                    workspace_id: 7,
                    subtasks: [
                        { id: 31, title: "The intro", status: "doing", bot_id: 3, bot_name: "Software Engineer" },
                        { id: 32, title: "The appendix", status: "done", bot_id: 4, bot_name: "SEO Expert" },
                    ],
                })}
                onChanged={noop}
                onDeleted={noop}
            />,
        );

        expect(html).toContain("Subtasks (2, 1 open)");
        expect(html).toContain("The intro");
        expect(html).toContain("Software Engineer");
    });

    test("a wide task nobody split yet says so", () => {
        const html = renderToString(
            <TaskDetailPanel task={detail({ bot_id: "", workspace_id: 7 })} onChanged={noop} onDeleted={noop} />,
        );

        expect(html).toContain("Not split yet");
    });

    test("a task with more subtasks than the panel shows offers them all", () => {
        const total = AppData.TaskSubtasksShown + 2;
        const subtasks = Array.from({ length: total }, (unused, index) => ({
            id: 40 + index,
            title: `Piece ${index + 1}`,
            status: "todo" as const,
            bot_id: 3 + index,
            bot_name: `Bot ${3 + index}`,
        }));

        const html = renderToString(
            <TaskDetailPanel
                task={detail({ bot_id: "", workspace_id: 7, subtasks })}
                onOpenSubtask={noop}
                onChanged={noop}
                onDeleted={noop}
            />,
        );

        expect(html).toContain(`Subtasks (${total}, ${total} open)`);
        expect(html).toContain("Piece 1");
        expect(html).toContain(`Piece ${AppData.TaskSubtasksShown}`);
        expect(html).not.toContain(`Piece ${AppData.TaskSubtasksShown + 1}`);
        expect(html).toContain(`View all ${total} subtasks`);
    });

    test("a subtask says which task it belongs to, and opens it", () => {
        const html = renderToString(
            <TaskDetailPanel
                task={detail({ bot_id: 3, workspace_id: 7, parent_task_id: 12, parent_title: "Ship the release" })}
                onOpenParent={noop}
                onChanged={noop}
                onDeleted={noop}
            />,
        );

        expect(html).toContain("Parent task");
        expect(html).toContain("#12 Ship the release");
        expect(html).toContain("Open the task this is a subtask of");
    });
});