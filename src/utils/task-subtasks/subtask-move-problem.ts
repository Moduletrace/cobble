type TaskLike = {
    id?: number | string | null;
    title?: string | null;
    parent_task_id?: number | string | null;
};

type Params = {
    task: TaskLike;
    /**
     * How many tasks are subtasks of it (`parent_task_id` pointing at it),
     * open or not.
     */
    linked_subtasks: number;
};

/**
 * Why a task can't be moved to another bot or list (handed over, made
 * workspace-wide), or null when it can. A workspace-wide task with subtasks
 * stays where it is until every subtask is unlinked, and a subtask itself is
 * never moved: it is one piece of its parent's work, and a task that can be
 * moved has no subtasks attached either way.
 */
export default function subtaskMoveProblem({ task, linked_subtasks }: Params): string | null {
    const label = `Task #${task.id}${task.title ? ` "${task.title}"` : ""}`;

    if (task.parent_task_id) {
        return `${label} is a subtask of task #${task.parent_task_id}: unlink it from the parent first, then move it.`;
    }

    if (linked_subtasks > 0) {
        return `${label} has ${linked_subtasks} subtask${linked_subtasks == 1 ? "" : "s"}: unlink ${linked_subtasks == 1 ? "it" : "them all"} first, then move it.`;
    }

    return null;
}