import { z } from "zod";
import assertUserReachesTask from "@/src/functions/backend/db/tasks/assert-user-reaches-task";
import deleteTask from "@/src/functions/backend/db/tasks/delete-task";
import grabRunTask from "@/src/functions/backend/db/tasks/grab-run-task";
import type { HarnessTool } from "../../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
};

type Args = {
    task_id: number;
};

/**
 * Lets a chat reply delete a task the user asked to have deleted, with its
 * notes and file links (`deleteTask`; the files stay where they live).
 * Without it, bots cancelled tasks and told the user they were removed.
 * The run must reach the task (`grabRunTask`) and so must its user
 * (`assertUserReachesTask`). Only chat replies get it: a routine, a hook
 * call has no user asking, and a payload could ask for it.
 */
export default function deleteTaskTool({ user_id, bot_id, is_coordinator, admin_workspace_ids = [] }: Params): HarnessTool<Args> {
    return {
        name: "delete_task",
        description: `Delete a task from the to-do list for good, with its notes and file links (the files themselves stay). Only when the user asked for that task, or tasks like it, to be deleted; work that was dropped but should stay on record is cancelled with update_task instead. Say "deleted" only after this call says so; cancelling isn't deleting.`,
        schema: z.object({
            task_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const task = await grabRunTask({ task_id: args.task_id, bot_id, is_coordinator, admin_workspace_ids });

            await assertUserReachesTask({ user_id, task_id: task.id! });
            await deleteTask({ user_id, task_id: task.id!, deleted_by_bot_id: bot_id });

            return `Deleted task #${task.id} "${task.title || "Untitled"}". It no longer exists, so don't update or link it again.`;
        },
    };
}
