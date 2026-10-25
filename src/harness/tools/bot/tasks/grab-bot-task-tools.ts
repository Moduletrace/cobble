import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabStorageScopes from "@/src/utils/storage-access";
import type { HarnessTool } from "../../../types";
import createTaskTool from "./create-task-tool";
import listTasksTool from "./list-tasks-tool";
import updateTaskTool from "./update-task-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * Whether the run is the coordinator, which reaches every task, can add
     * to any list and reaches every folder.
     */
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`): in one of
     * them, create_task can also add to the other members' own lists.
     */
    admin_workspace_ids?: number[];
    workspace_id?: number | string | null;
};

/**
 * The task tools every run gets (`src/harness/tools/bot/tasks/`): the
 * shared to-do list, one per bot and one per workspace, so a chat reply, a
 * task and a scheduled run all read it, move it along and file what they
 * produced. The coordinator's create_task may target any worker or
 * workspace; its update_task may link any file it can reach. A workspace
 * admin's may add to the other members' own lists there.
 */
export default async function grabBotTaskTools({
    user_id,
    bot_id,
    is_coordinator,
    admin_workspace_ids = [],
    workspace_id,
}: Params): Promise<HarnessTool[]> {
    let workers: BUN_SQLITE_COBBLE_BOTS[] = [];
    let members: BUN_SQLITE_COBBLE_BOTS[] = [];
    let workspaces: BUN_SQLITE_COBBLE_WORKSPACES[] = [];
    let all_workspace_ids: number[] = [];

    if (is_coordinator) {
        workers = await grabCrewWorkers({ workspace_id });
        workspaces = (await grabUserWorkspaces({ user_id })).filter((workspace) => !workspace.archived);
        all_workspace_ids = workspaces.map((workspace) => Number(workspace.id));
    } else if (workspace_id && admin_workspace_ids.includes(Number(workspace_id))) {
        members = (await grabCrewWorkers({ workspace_id })).filter((member) => member.id != Number(bot_id));
    }

    /**
     * `grabStorageScopes` wants a numeric bot id.
     */
    const numeric_bot_id = Number(bot_id);

    const scopes = grabStorageScopes({
        bot_id: numeric_bot_id,
        bot_kind: is_coordinator ? "coordinator" : "worker",
        workspace_id: workspace_id ? Number(workspace_id) : null,
        all_workspace_ids,
    });

    return [
        listTasksTool({ user_id, bot_id, is_coordinator, admin_workspace_ids, workspace_id }),
        createTaskTool({
            user_id,
            bot_id,
            workspace_id,
            is_coordinator,
            workers,
            workspaces,
            admin_workspace_ids,
            members,
        }),
        updateTaskTool({ user_id, bot_id, is_coordinator, admin_workspace_ids, scopes }),
    ];
}
