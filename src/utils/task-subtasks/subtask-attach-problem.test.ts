import { describe, expect, test } from "bun:test";
import subtaskAttachProblem from "./subtask-attach-problem";

const parent = {
    id: 12,
    title: "Ship the release",
    bot_id: null,
    workspace_id: 4,
    parent_task_id: null,
    status: "doing",
};

const task = {
    id: 30,
    title: "The intro",
    bot_id: 7,
    workspace_id: 4,
    parent_task_id: null,
    status: "todo",
};

describe("subtaskAttachProblem", () => {
    test("an open task of a bot in the parent's workspace can join it", () => {
        expect(subtaskAttachProblem({ task, parent })).toBeNull();
    });

    test("a task that isn't there can't join anything", () => {
        expect(subtaskAttachProblem({ task: null, parent })).toContain("doesn't exist");
    });

    test("a task can't be a subtask of itself", () => {
        expect(subtaskAttachProblem({ task: parent, parent })).toContain("subtask of itself");
    });

    test("a subtask of another task is unlinked first", () => {
        expect(subtaskAttachProblem({ task: { ...task, parent_task_id: 9 }, parent })).toContain(
            "already a subtask of task #9",
        );
    });

    test("a task with parts of its own can't become one", () => {
        expect(subtaskAttachProblem({ task, parent, task_subtasks: 2 })).toContain("a subtask can't be a parent");
    });

    test("only a bot's task in a workspace can join one", () => {
        expect(subtaskAttachProblem({ task: { ...task, bot_id: null }, parent })).toContain("nothing to be a subtask of");
        expect(subtaskAttachProblem({ task: { ...task, workspace_id: null }, parent })).toContain(
            "nothing to be a subtask of",
        );
    });

    test("a closed task can't become a subtask", () => {
        expect(subtaskAttachProblem({ task: { ...task, status: "done" }, parent })).toContain("closed task");
    });

    test("the parent still has to be a splittable workspace-wide task", () => {
        expect(subtaskAttachProblem({ task, parent: { ...parent, bot_id: 7 } })).toContain("isn't workspace-wide");
        expect(subtaskAttachProblem({ task: { ...task, workspace_id: 5 }, parent })).toContain("same workspace");
    });
});