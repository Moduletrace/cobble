import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import updateWorkspaceTool from "./update-workspace-tool";

describe("updateWorkspaceTool", () => {
    test("lists a workspace created after the tool was built", async () => {
        const workspaces: BUN_SQLITE_COBBLE_WORKSPACES[] = [];
        const tool = updateWorkspaceTool({ user_id: 1, workspaces });

        /**
         * What create_workspace does with the row it makes, later in the
         * same reply.
         */
        workspaces.push({ id: 12, name: "Beetrelle" } as BUN_SQLITE_COBBLE_WORKSPACES);

        await expect(
            tool.run({ args: { workspace_id: 99, description: "Home fragrance" } } as never),
        ).rejects.toThrow("Workspaces: 12: Beetrelle.");
    });
});
