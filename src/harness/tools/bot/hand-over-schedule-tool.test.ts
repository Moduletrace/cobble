import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import handOverScheduleTool from "./hand-over-schedule-tool";

const worker = { id: 5, name: "Researcher", kind: "worker" } as BUN_SQLITE_COBBLE_BOTS;
const workspace = { id: 3, name: "Launch", archived: 0 } as BUN_SQLITE_COBBLE_WORKSPACES;

/**
 * What needs no database: the arguments it takes and what it tells the
 * bot about where a handed-over schedule runs.
 */
describe("handOverScheduleTool", () => {
    test("takes a schedule, a crew member and, from its own chat, a workspace", () => {
        const tool = handOverScheduleTool({
            user_id: 1,
            bot_id: 1,
            requester_name: "Coordinator",
            workers: [worker],
            workspaces: [workspace],
        });

        expect(tool.name).toBe("hand_over_schedule");
        expect(tool.schema?.safeParse({ schedule_id: 4, bot_id: 5 }).success).toBe(true);
        expect(tool.schema?.safeParse({ schedule_id: 4, bot_id: 5, workspace_id: 3 }).success).toBe(true);
        expect(tool.description).toContain("5: Researcher");
        expect(tool.description).toContain("3: Launch");
    });

    test("in a workspace, says only the schedules that run there go", () => {
        const tool = handOverScheduleTool({
            user_id: 1,
            bot_id: 7,
            workspace_id: 3,
            requester_name: "Lead",
            workers: [worker],
        });

        expect(tool.description).toContain("only the schedules that run here");
        expect(tool.description).not.toContain("Workspaces:");
    });
});
