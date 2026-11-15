import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import subtaskAttachProblem from "@/src/utils/task-subtasks/subtask-attach-problem";
import addTaskNote from "./add-task-note";
import grabSubtaskCounts from "./grab-subtask-counts";
import grabTask from "./grab-task";
import grabTaskRow from "./grab-task-scope";

type Params = {
    /**
     * The user attaching it; they must reach the task.
     */
    user_id: number | string;
    task_id: number | string;
    /**
     * The workspace-wide task it becomes a part of.
     */
    parent_task_id: number | string;
    /**
     * The bot's run doing it; none for the user. Either way, the caller
     * checked the run or user reaches the task.
     */
    by_bot_id?: number | string | null;
    /**
     * Who did it, for the two logs.
     */
    by_name: string;
};

/**
 * Attaches a bot's open task in a workspace to a workspace-wide task there:
 * the part of it that bot took on (`subtaskAttachProblem` says when it
 * can't). Both logs say who joined which, since the parent's own log is
 * where a crew manager sees how the split work is going.
 */
export default async function linkSubtask({
    user_id,
    task_id,
    parent_task_id,
    by_bot_id,
    by_name,
}: Params): Promise<TaskDetail> {
    const task = await grabTaskRow({ task_id });
    /**
     * Read the same way: a missing parent throws "Task not found" before
     * anything is written.
     */
    const parent = await grabTaskRow({ task_id: parent_task_id });
    const [{ linked }, own] = await Promise.all([
        grabSubtaskCounts({ task_id: parent_task_id }),
        grabSubtaskCounts({ task_id }),
    ]);
    const problem = subtaskAttachProblem({ task, parent, task_subtasks: own.linked });

    if (problem) throw new AppError(problem);

    if (linked >= AppData.TaskSubtaskMaxPerParent) {
        throw new AppError(
            `Task #${parent.id} already has ${AppData.TaskSubtaskMaxPerParent} parts: work on one of those, or unlink one first.`,
        );
    }

    const res = await BunSQLite.sql({
        sql: `UPDATE tasks SET parent_task_id = ?, updated_at = ? WHERE id = ?`,
        values: [Number(parent.id), Date.now(), Number(task.id)],
    });

    if (!res.success) {
        throw new AppError(`Couldn't link the task: ${res.msg || res.error}`);
    }

    const author = by_bot_id ? "bot" : "user";
    const parent_label = `task #${parent.id}${parent.title ? ` "${parent.title}"` : ""}`;

    await addTaskNote({
        task_id: Number(task.id),
        text: `${by_name} made this a part of ${parent_label}.`,
        author,
        bot_id: by_bot_id ? Number(by_bot_id) : null,
    });

    await addTaskNote({
        task_id: Number(parent.id),
        text: `${by_name} took on task #${task.id}${task.title ? ` "${task.title}"` : ""} as a part.`,
        author,
        bot_id: by_bot_id ? Number(by_bot_id) : null,
    });

    return await grabTask({ user_id, task_id });
}