import type { TaskWithNames } from "@/src/types";
import grabTasks from "./grab-tasks";

type Params = {
    /**
     * The user asking: they must reach the workspace.
     */
    user_id: number | string;
    /**
     * The task that would become a part: its own workspace's wide tasks are
     * the only ones it can join.
     */
    task: { id?: number | string | null; workspace_id?: number | string | null };
};

/**
 * The workspace-wide tasks a bot's task in that workspace can be attached
 * to: the open ones, the user's to pick from when the picker opens.
 */
export default async function grabSubtaskParents({ user_id, task }: Params): Promise<TaskWithNames[]> {
    if (!task.workspace_id) return [];

    const tasks = await grabTasks({ user_id, only_workspace_id: task.workspace_id, open_only: true });

    return tasks.filter((candidate) => !candidate.bot_id && Number(candidate.id) != Number(task.id || 0));
}