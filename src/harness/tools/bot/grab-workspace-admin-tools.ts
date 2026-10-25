import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotRunPowers } from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import grabDirectableBots from "@/src/functions/backend/db/bot-types/grab-directable-bots";
import grabCrewRole from "@/src/functions/backend/db/access/grab-crew-role";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import type { StorageScope } from "@/src/utils/storage-access";
import type { HarnessTool } from "../../types";
import delegateTaskTool from "./delegate-task-tool";
import handOverScheduleTool from "./hand-over-schedule-tool";
import setWorkspaceInstructionsTool from "./set-workspace-instructions-tool";
import updateWorkspaceTool from "./update-workspace-tool";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    user_id: number | string;
    workspace_id: number | string;
    powers: BotRunPowers;
    /**
     * The session being answered: delegated work reports back to it. Left
     * out (a task run), nothing is handed over.
     */
    session_id?: number | string;
    scopes?: StorageScope[];
};

export type WorkspaceAdminTools = {
    tools: HarnessTool[];
    /**
     * The bots it may direct there.
     */
    members: BUN_SQLITE_COBBLE_BOTS[];
    workspace: BUN_SQLITE_COBBLE_WORKSPACES | null;
};

/**
 * The tools a workspace admin leads its workspace with, each only while
 * its types allow it there (`BotRunPowers.can`): delegate_task (with
 * hand_over_schedule beside it) and set_bot_workspace_instructions for the members it may direct
 * (`grabDirectableBots`), and update_workspace for this workspace alone,
 * only when the user the run works for may change it too (a crew manager).
 */
export default async function grabWorkspaceAdminTools({
    bot,
    user_id,
    workspace_id,
    powers,
    session_id,
    scopes = [],
}: Params): Promise<WorkspaceAdminTools> {
    const workspace = await grabUserWorkspace({ workspace_id, user_id });

    if (!workspace?.id || workspace.archived || !powers.is_workspace_admin) {
        return { tools: [], members: [], workspace: null };
    }

    const bot_id = bot.id || 0;
    const tools: HarnessTool[] = [];
    const members = await grabDirectableBots({ bot_id, workspace_id });
    const grabTargets = () => grabDirectableBots({ bot_id, workspace_id });

    if (members.length && session_id && powers.can("delegate_task")) {
        tools.push(
            delegateTaskTool({
                user_id,
                requester_id: bot_id,
                session_id,
                workspace_id,
                requester_name: bot.name || "The workspace's admin",
                workers: members,
                grabTargets,
                admin_workspace_ids: powers.admin_workspace_ids,
            }),
            handOverScheduleTool({
                user_id,
                bot_id,
                workspace_id,
                requester_name: bot.name || "The workspace's admin",
                workers: members,
                grabTargets,
            }),
        );
    }

    if (members.length && powers.can("set_member_instructions")) {
        tools.push(setWorkspaceInstructionsTool({ user_id, workspace_id, workers: members, grabTargets }));
    }

    if (powers.can("edit_workspace") && (await grabCrewRole({ user_id })) != "member") {
        tools.push(updateWorkspaceTool({ user_id, workspaces: [workspace], workspace_id, scopes }));
    }

    return { tools, members, workspace };
}
