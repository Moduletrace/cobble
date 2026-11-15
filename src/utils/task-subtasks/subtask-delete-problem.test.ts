import { describe, expect, test } from "bun:test";
import subtaskDeleteProblem from "./subtask-delete-problem";

describe("subtaskDeleteProblem", () => {
    test("a task whose parts are all finished can go", () => {
        expect(subtaskDeleteProblem({ task: { id: 12, title: "Ship the release" }, open_subtasks: 0 })).toBeNull();
    });

    test("open parts hold the delete back", () => {
        expect(subtaskDeleteProblem({ task: { id: 12, title: "Ship the release" }, open_subtasks: 2 })).toContain(
            "still has 2 open subtasks",
        );

        expect(subtaskDeleteProblem({ task: { id: 12 }, open_subtasks: 1 })).toContain("1 open subtask:");
    });
});