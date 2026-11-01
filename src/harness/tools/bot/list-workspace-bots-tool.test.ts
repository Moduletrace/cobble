import { describe, expect, test } from "bun:test";
import { ReservedToolNames } from "@/src/dict/custom-tool-dict";
import listWorkspaceBotsTool from "./list-workspace-bots-tool";

/**
 * What needs no database: the arguments it takes, and that a custom tool
 * can't take its name.
 */
describe("listWorkspaceBotsTool", () => {
    test("takes a workspace id", () => {
        const tool = listWorkspaceBotsTool({ user_id: 1 });

        expect(tool.schema?.safeParse({ workspace_id: 3 }).success).toBe(true);
        expect(tool.schema?.safeParse({}).success).toBe(false);
    });

    test("its name is reserved", () => {
        expect(ReservedToolNames as readonly string[]).toContain(listWorkspaceBotsTool({ user_id: 1 }).name);
    });
});
