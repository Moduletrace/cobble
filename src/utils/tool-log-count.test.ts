import { describe, expect, test } from "bun:test";
import toolLogCount from "./tool-log-count";

describe("toolLogCount", () => {
    test("counts a recorded run's calls, none included", () => {
        expect(toolLogCount({ tool_log: "[]" })).toBe(0);
        expect(toolLogCount({ tool_log: '[{"name":"start_task","ok":true}]' })).toBe(1);
    });

    test("is null when the run wasn't recorded", () => {
        expect(toolLogCount({ tool_log: null })).toBeNull();
        expect(toolLogCount({ tool_log: "" })).toBeNull();
        expect(toolLogCount({ tool_log: "{oops" })).toBeNull();
        expect(toolLogCount({ tool_log: "{}" })).toBeNull();
    });
});
