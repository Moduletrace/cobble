import { describe, expect, test } from "bun:test";
import subtaskLinkProblem from "./subtask-link-problem";

const parent = {
    id: 12,
    title: "Ship the release",
    bot_id: null,
    workspace_id: 4,
    parent_task_id: null,
    status: "doing",
};

describe("subtaskLinkProblem", () => {
    test("a bot's task in the parent's workspace can be a part of it", () => {
        expect(subtaskLinkProblem({ parent, bot_id: 7, workspace_id: 4 })).toBeNull();
    });

    test("a parent that isn't there is refused", () => {
        expect(subtaskLinkProblem({ parent: null, bot_id: 7, workspace_id: 4 })).toContain("doesn't exist");
    });

    test("only a workspace-wide task can be split", () => {
        expect(
            subtaskLinkProblem({ parent: { ...parent, bot_id: 7 }, bot_id: 7, workspace_id: 4 }),
        ).toContain("isn't workspace-wide");

        expect(
            subtaskLinkProblem({ parent: { ...parent, workspace_id: null }, bot_id: 7, workspace_id: 4 }),
        ).toContain("isn't workspace-wide");
    });

    test("a part can't be split again", () => {
        expect(
            subtaskLinkProblem({ parent: { ...parent, parent_task_id: 3 }, bot_id: 7, workspace_id: 4 }),
        ).toContain("can't be split again");

        // A real part has a bot, which is no reason to call it something else.
        expect(
            subtaskLinkProblem({ parent: { ...parent, bot_id: 7, parent_task_id: 3 }, bot_id: 8, workspace_id: 4 }),
        ).toContain("can't be split again");
    });

    test("a part belongs to one bot", () => {
        expect(subtaskLinkProblem({ parent, bot_id: null, workspace_id: 4 })).toContain("belongs to one bot");
    });

    test("a part stays in its parent's workspace", () => {
        expect(subtaskLinkProblem({ parent, bot_id: 7, workspace_id: 9 })).toContain("same workspace");
        expect(subtaskLinkProblem({ parent, bot_id: 7, workspace_id: null })).toContain("same workspace");
    });

    test("a closed task can't be split", () => {
        expect(
            subtaskLinkProblem({ parent: { ...parent, status: "done" }, bot_id: 7, workspace_id: 4 }),
        ).toContain("can't be split");

        expect(
            subtaskLinkProblem({ parent: { ...parent, status: "cancelled" }, bot_id: 7, workspace_id: 4 }),
        ).toContain("can't be split");
    });
});