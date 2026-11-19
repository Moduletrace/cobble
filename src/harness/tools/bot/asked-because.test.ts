import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { BotRunPowers } from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import addBotToWorkspaceTool from "./add-bot-to-workspace-tool";
import assignComputerTool from "./assign-computer-tool";
import createBotTool from "./create-bot-tool";
import createWorkspaceTool from "./create-workspace-tool";
import delegateTaskTool from "./delegate-task-tool";
import deleteBotTool from "./delete-bot-tool";
import deleteWorkspaceTool from "./delete-workspace-tool";
import handOverScheduleTool from "./hand-over-schedule-tool";
import handOverTaskTool from "./hand-over-task-tool";
import removeBotFromWorkspaceTool from "./remove-bot-from-workspace-tool";
import setBotTypeTool from "./set-bot-type-tool";

const coordinator = { id: 1, name: "Coordinator", kind: "coordinator" } as BUN_SQLITE_COBBLE_BOTS;
const powers = { is_coordinator: false, admin_workspace_ids: [], can: () => false } as unknown as BotRunPowers;

/**
 * Every tool that changes the crew or hands work out carries the user's own
 * words, so a bot can't do it because a failed call left it an opening.
 * `assertUserAsked` checks the quote; this pins that each tool asks for one
 * at all.
 */
const tools = {
    add_bot_to_workspace: addBotToWorkspaceTool({ user_id: 1, workers: [], workspaces: [] }),
    remove_bot_from_workspace: removeBotFromWorkspaceTool({ user_id: 1, workers: [], workspaces: [] }),
    assign_computer: assignComputerTool({ user_id: 1, workers: [], computers: [], access: {} }),
    set_bot_type: setBotTypeTool({ user_id: 1, bot_id: 1, workers: [], workspaces: [] }),
    create_bot: createBotTool({ user_id: 1, workspaces: [] }),
    create_workspace: createWorkspaceTool({ user_id: 1, workspaces: [] }),
    delete_bot: deleteBotTool({ user_id: 1, workers: [] }),
    delete_workspace: deleteWorkspaceTool({ user_id: 1, workspaces: [] }),
    delegate_task: delegateTaskTool({ user_id: 1, requester_id: 1, session_id: 1, requester_name: "Coordinator", workers: [] }),
    hand_over_task: handOverTaskTool({ user_id: 1, bot: coordinator, session_id: 1, powers, workers: [], grabTargets: async () => [] }),
    hand_over_schedule: handOverScheduleTool({ user_id: 1, bot_id: 1, requester_name: "Coordinator", workers: [] }),
};

describe("the crew change and hand-out tools", () => {
    for (const [name, tool] of Object.entries(tools)) {
        test(`${name} requires the user's own words as because`, () => {
            const result = tool.schema?.safeParse({});
            const paths = result?.success === false ? result.error.issues.map((issue) => issue.path[0]) : [];

            expect(paths).toContain("because");
            expect(tool.description).toContain("because");
        });
    }
});
