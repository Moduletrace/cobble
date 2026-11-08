import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import listWorkspacePeopleTool from "./list-workspace-people-tool";
import setUserWorkspaceRoleTool from "./set-user-workspace-role-tool";

describe("workspace role tools", () => {
    test("refuse a workspace the coordinator doesn't reach, listing the ones it does", async () => {
        const workspaces = [{ id: 12, name: "Launch" }] as BUN_SQLITE_COBBLE_WORKSPACES[];

        await expect(
            setUserWorkspaceRoleTool({ user_id: 1, workspaces }).run({
                args: { workspace_id: 99, user_id: 6, role: "Ops lead." },
            } as never),
        ).rejects.toThrow("Workspaces: 12: Launch.");
        await expect(
            listWorkspacePeopleTool({ workspaces }).run({ args: {} } as never),
        ).rejects.toThrow("No workspace has id (none given)");
    });

});
