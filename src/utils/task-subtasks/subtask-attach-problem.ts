import { OpenTaskStatuses } from "@/src/dict/task-dict";
import subtaskLinkProblem from "./subtask-link-problem";

type TaskLike = {
    id?: number | string | null;
    title?: string | null;
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
    parent_task_id?: number | string | null;
    status?: string | null;
};

type Params = {
    /**
     * The task that would become a part, read as it is.
     */
    task?: TaskLike | null;
    /**
     * The workspace-wide task it would join.
     */
    parent?: TaskLike | null;
    /**
     * How many parts the task itself has of its own (`grabSubtaskCounts`):
     * a task with parts can't become one, since splitting goes one level
     * deep.
     */
    task_subtasks?: number;
};

/**
 * Why that task can't be attached to that workspace-wide one, or null when
 * it can. The parent has to be a wide, open task that isn't itself a part
 * (`subtaskLinkProblem`), and this side has to be an open task of one bot in
 * the same workspace that has no parts of its own: one level of splitting.
 */
export default function subtaskAttachProblem({ task, parent, task_subtasks }: Params): string | null {
    if (!task?.id) return `That task doesn't exist, so it can't become a part of anything.`;

    const label = `Task #${task.id}${task.title ? ` "${task.title}"` : ""}`;

    if (Number(task.id) == Number(parent?.id || 0)) {
        return `${label} can't be a part of itself.`;
    }

    if (task.parent_task_id) {
        return `${label} is already a part of task #${task.parent_task_id}: unlink it from that one first.`;
    }

    if (Number(task_subtasks || 0)) {
        return `${label} has ${task_subtasks} part(s) of its own: a part can't be a parent, so unlink them first.`;
    }

    if (!task.bot_id || !task.workspace_id) {
        return `${label} isn't a bot's task in a workspace, so it has nothing to be a part of: only a task a bot has there can join a workspace-wide one.`;
    }

    if (!OpenTaskStatuses.includes(task.status as (typeof OpenTaskStatuses)[number])) {
        return `${label} is ${task.status}: a closed task can't become a part.`;
    }

    return subtaskLinkProblem({ parent, bot_id: task.bot_id, workspace_id: task.workspace_id });
}