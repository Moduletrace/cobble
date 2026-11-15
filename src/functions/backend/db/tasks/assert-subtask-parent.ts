import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import subtaskLinkProblem from "@/src/utils/task-subtasks/subtask-link-problem";
import grabTaskRow from "./grab-task-scope";

type Params = {
    parent_task_id: number | string;
    /**
     * Who would have the subtask (a subtask always belongs to one bot).
     */
    bot_id?: number | string | null;
    /**
     * The workspace it would be created in.
     */
    workspace_id?: number | string | null;
};

/**
 * The task a new subtask would belong to, checked: a workspace-wide task that
 * isn't itself a subtask, open, in the subtask's workspace
 * (`subtaskLinkProblem`). The caller checked who is asking reaches the
 * parent. Returns the parent's row.
 */
export default async function assertSubtaskParent({ parent_task_id, bot_id, workspace_id }: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const parent = await grabTaskRow({ task_id: parent_task_id });
    const problem = subtaskLinkProblem({ parent, bot_id, workspace_id });

    if (problem) throw new AppError(problem);

    return parent;
}