import { describe, expect, test } from "bun:test";
import trackerTaskEnding from "./tracker-task-ending";

describe("trackerTaskEnding", () => {
    test("says a finished run left the task where it was", () => {
        expect(trackerTaskEnding({ name: "Writer", status: "doing" })).toEqual({
            blocked_reason: null,
            note: "Writer's run finished; the task is still doing.",
        });
    });

    test("blocks the task with why the run failed", () => {
        expect(trackerTaskEnding({ name: "Writer", status: "doing", failure: "Model refused." })).toEqual({
            blocked_reason: "Writer couldn't finish it. Model refused.",
            note: "Writer couldn't finish it. Model refused.",
        });
    });

    test("blocks the task when the run used every step it had", () => {
        const ending = trackerTaskEnding({ name: "Writer", status: "doing", exhausted: true });

        expect(ending.blocked_reason || "").toContain("used every step its run allowed and stopped before finishing it");
        expect(ending.note).toBe(String(ending.blocked_reason));
    });

    test("a failure's reason wins over a spent budget", () => {
        expect(
            trackerTaskEnding({ name: "Writer", status: "doing", failure: "No room.", exhausted: true })
                .blocked_reason,
        ).toBe("Writer couldn't finish it. No room.");
    });
});