import { describe, expect, test } from "bun:test";
import handOverPlace from "./hand-over-place";

describe("handOverPlace", () => {
    test("work in a workspace stays there", () => {
        expect(handOverPlace({ workspace_id: 3, label: "Task #1" })).toBe(3);
        expect(handOverPlace({ workspace_id: 3, asked_workspace_id: 3, label: "Task #1" })).toBe(3);
    });

    test("refuses to move work out of its workspace", () => {
        expect(() => handOverPlace({ workspace_id: 3, asked_workspace_id: 4, label: "Task #1" })).toThrow(
            /Task #1 belongs to workspace 3/,
        );
    });

    test("a bot's own goes to the asked workspace, else the new bot's own chat", () => {
        expect(handOverPlace({ workspace_id: null, asked_workspace_id: 5, label: "Routine #2" })).toBe(5);
        expect(handOverPlace({ workspace_id: null, label: "Routine #2" })).toBeNull();
        expect(handOverPlace({ workspace_id: "", asked_workspace_id: null, label: "Routine #2" })).toBeNull();
    });
});
