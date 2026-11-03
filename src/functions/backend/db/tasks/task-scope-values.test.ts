import { describe, expect, test } from "bun:test";
import taskScopeValues from "./task-scope-values";

describe("taskScopeValues", () => {
    test("a task on a bot's own list or in a workspace has its bot", () => {
        expect(taskScopeValues({ bot_id: 3 })).toEqual({ bot_id: 3, workspace_id: null });
        expect(taskScopeValues({ bot_id: "3", workspace_id: "11" })).toEqual({ bot_id: 3, workspace_id: 11 });
    });

    test("a workspace task without a bot is refused unless asked for as workspace-wide", () => {
        expect(() => taskScopeValues({ workspace_id: 11 })).toThrow();
        expect(() => taskScopeValues({})).toThrow();
    });

    test("a workspace-wide task has its workspace and no bot", () => {
        expect(taskScopeValues({ workspace_id: 11, workspace_wide: true })).toEqual({ bot_id: null, workspace_id: 11 });
        expect(() => taskScopeValues({ workspace_wide: true })).toThrow();
        expect(() => taskScopeValues({ bot_id: 3, workspace_id: 11, workspace_wide: true })).toThrow();
    });
});
