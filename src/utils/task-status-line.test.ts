import { describe, expect, test } from "bun:test";
import taskStatusLine from "./task-status-line";

describe("taskStatusLine", () => {
    test("names the workspace a task runs in", () => {
        expect(taskStatusLine({ workspace_name: "Launch" })).toBe("Working on a task in Launch workspace");
    });

    test("says just working on a task outside a workspace", () => {
        expect(taskStatusLine({})).toBe("Working on a task");
        expect(taskStatusLine({ workspace_name: "  " })).toBe("Working on a task");
    });
});
