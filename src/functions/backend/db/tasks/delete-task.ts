import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASK_MEDIA, BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import subtaskDeleteProblem from "@/src/utils/task-subtasks/subtask-delete-problem";
import grabCrewRole from "../access/grab-crew-role";
import deleteMedia from "../media/delete-media";
import grabSubtaskCounts from "./grab-subtask-counts";
import grabTaskRow from "./grab-task-scope";

type Params = {
    user_id: number | string;
    task_id: number | string;
    /**
     * A bot's run deleting its task; none for the user. Either way, the
     * caller checked the run reaches it.
     */
    deleted_by_bot_id?: number | string | null;
};

/**
 * Deletes a task with its notes and file links (cascades), and with its
 * subtasks when they are all finished: refused while any subtask is still open
 * (`subtaskDeleteProblem`), so a delete never throws away work someone is
 * on. The files themselves stay where they are: a `task_media` link is not
 * the bytes' owner, so a bot file's folder keeps its file and only the
 * link goes.
 */
export default async function deleteTask({ user_id, task_id, deleted_by_bot_id }: Params) {
    const task = await grabTaskRow({ task_id });
    const role = await grabCrewRole({ user_id });

    if (!deleted_by_bot_id && role == "member") {
        throw new AppError(`Only an admin can delete a task.`);
    }

    const { open } = await grabSubtaskCounts({ task_id: task.id! });
    const problem = subtaskDeleteProblem({ task, open_subtasks: open });

    if (problem) throw new AppError(problem);

    const children = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>({
            sql: `SELECT * FROM tasks WHERE parent_task_id = ?`,
            values: [Number(task.id)],
        })
    ).payload || [];

    const child_ids = children.map((child) => Number(child.id));

    /**
     * Read before the delete: the links go with the tasks, and the media
     * rows a chat upload left are deleted with them (a bot file's bytes
     * belong to its folder, not to the task).
     */
    const links = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_MEDIA>({
            sql: `SELECT * FROM task_media WHERE task_id = ? OR task_id IN (${child_ids.map(() => "?").join(", ") || "NULL"})`,
            values: [Number(task.id), ...child_ids],
        })
    ).payload || [];

    const res = await BunSQLite.sql({ sql: `DELETE FROM tasks WHERE id = ?`, values: [Number(task.id)] });

    if (!res.success) {
        throw new AppError(`Couldn't delete the task: ${res.msg || res.error}`);
    }

    /**
     * The subtasks go explicitly, children first: foreign keys are off outside
     * the server process, so nothing cascades on its own.
     */
    if (child_ids.length) {
        const marks = child_ids.map(() => "?").join(", ");

        await BunSQLite.sql({ sql: `DELETE FROM task_notes WHERE task_id IN (${marks})`, values: child_ids });
        await BunSQLite.sql({ sql: `DELETE FROM task_media WHERE task_id IN (${marks})`, values: child_ids });
        await BunSQLite.sql({ sql: `DELETE FROM tasks WHERE id IN (${marks})`, values: child_ids });
    }

    const uploads = links.filter((link) => !link.bot_file_id).map((link) => Number(link.media_id));

    if (uploads.length) {
        await deleteMedia({ ids: uploads, user_id, can_delete_all_media: true }).catch(() => {});
    }

    return task;
}
