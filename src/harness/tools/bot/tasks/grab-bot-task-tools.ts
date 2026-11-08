import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabStorageScopes from "@/src/utils/storage-access";
import type { HarnessTool } from "../../../types";
import createTaskTool from "./create-task-tool";
import deleteTaskTool from "./delete-task-tool";
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
     * them, create_task can also give tasks there to the other members.
     */
    admin_workspace_ids?: number[];
    workspace_id?: number | string | null;
    /**
     * A chat reply the user follows: it also gets delete_task. Never a
     * routine, a hook call or a chatroom run.
     */
    can_delete?: boolean;
    /**
     * Called with each task the run reads in full, adds or moves along, so
     * the message it posts links to them (\`bot_messages.task_ids\`).
     */
    onTask?: (params: { task_id: number }) => void;
};

/**
 * The task tools every run gets (`src/harness/tools/bot/tasks/`): the
 * to-do list (its own list, its tasks in each workspace and the
 * workspace-wide ones there; an admin's whole workspace), so a chat reply, a task and a scheduled run all read it,
 * move it along and file what they produced. The coordinator's create_task
 * may target any worker or workspace; its update_task may link any file it
 * can reach. A workspace admin's may give tasks there to the other members.
 * Only a chat reply the user follows deletes tasks (`can_delete`).
 */
export default async function grabBotTaskTools({
    user_id,
    bot_id,
    is_coordinator,
    admin_workspace_ids = [],
    workspace_id,
    can_delete,
    onTask,
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
        listTasksTool({ user_id, bot_id, is_coordinator, admin_workspace_ids, workspace_id, onTask }),
        createTaskTool({
            user_id,
            bot_id,
            workspace_id,
            is_coordinator,
            workers,
            workspaces,
            admin_workspace_ids,
            members,
            onTask,
        }),
        updateTaskTool({ user_id, bot_id, is_coordinator, admin_workspace_ids, scopes, onTask }),
        ...(can_delete ? [deleteTaskTool({ user_id, bot_id, is_coordinator, admin_workspace_ids })] : []),
    ];
}
