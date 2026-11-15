type TaskLike = {
    id?: number | string | null;
    title?: string | null;
};

type Params = {
    task: TaskLike;
    /**
     * How many of its subtasks are still open (to do, doing or blocked).
     */
    open_subtasks: number;
};

/**
 * Why a workspace-wide task can't be deleted, or null when it can. Deleting
 * it takes its subtasks with it, so none of them may be work someone is still
 * on: finish or cancel them first.
 */
export default function subtaskDeleteProblem({ task, open_subtasks }: Params): string | null {
    if (open_subtasks <= 0) return null;

    const label = `Task #${task.id}${task.title ? ` "${task.title}"` : ""}`;

    return `${label} still has ${open_subtasks} open subtask${open_subtasks == 1 ? "" : "s"}: finish, cancel or unlink ${open_subtasks == 1 ? "it" : "them"} before deleting it.`;
}