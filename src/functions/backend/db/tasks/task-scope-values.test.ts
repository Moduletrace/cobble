import { describe, expect, test } from "bun:test";
import taskScopeValues from "./task-scope-values";

describe("taskScopeValues", () => {
    test("a task on a bot's own list or in a workspace has its bot", () => {
        expect(taskScopeValues({ bot_id: 3 })).toEqual({ bot_id: 3, workspace_id: null });
        expect(taskScopeValues({ bot_id: "3", workspace_id: "11" })).toEqual({ bot_id: 3, workspace_id: 11 });
    });

    test("a workspace task without a bot is refused", () => {
        expect(() => taskScopeValues({ workspace_id: 11 })).toThrow();
        expect(() => taskScopeValues({})).toThrow();
    });
});
