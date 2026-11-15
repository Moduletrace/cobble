import { describe, expect, test } from "bun:test";
import subtaskMoveProblem from "./subtask-move-problem";

describe("subtaskMoveProblem", () => {
    test("a task with no parts and no parent moves freely", () => {
        expect(subtaskMoveProblem({ task: { id: 5, title: "Check the invoices" }, linked_subtasks: 0 })).toBeNull();
    });

    test("a subtask is never moved", () => {
        expect(
            subtaskMoveProblem({ task: { id: 8, title: "The invoices", parent_task_id: 12 }, linked_subtasks: 0 }),
        ).toContain("unlink it from the parent first");
    });

    test("a task with parts stays until they're unlinked", () => {
        expect(subtaskMoveProblem({ task: { id: 12, title: "Ship the release" }, linked_subtasks: 3 })).toContain(
            "has 3 subtasks",
        );

        expect(subtaskMoveProblem({ task: { id: 12 }, linked_subtasks: 1 })).toContain("has 1 subtask:");
    });
});