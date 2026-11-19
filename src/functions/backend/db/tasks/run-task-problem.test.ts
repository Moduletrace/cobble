import { describe, expect, test } from "bun:test";
import runTaskProblem from "./run-task-problem";

describe("runTaskProblem", () => {
    test("a deleted task says it is gone, and not to keep working on it", () => {
        expect(runTaskProblem({ task_id: 16, exists: false })).toBe(
            "Task #16 doesn't exist any more. It was deleted, so don't update or link it again. Create a new task if the work still needs doing.",
        );
    });

    test("a task out of the run's reach keeps the reach message", () => {
        expect(runTaskProblem({ task_id: 16, exists: true })).toBe("Task #16 isn't one you can work on.");
    });
});
