import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import addTaskNote from "./add-task-note";
import grabTaskRow from "./grab-task-scope";

type Params = {
    task_id: number | string;
    /**
     * The bot unlinking it with its tool; none when a crew manager does.
     */
    by_bot_id?: number | string | null;
    /**
     * Who does, by name, for the log.
     */
    by_name: string;
};

/**
 * Takes a part out of its workspace-wide task, leaving an ordinary task of
 * its bot in that workspace, with a note saying it was unlinked. The only
 * way a part stops being one: a task that has parts can't be moved until
 * they are, and a part is never moved itself. The caller checked who is
 * asking may. Returns the row as it is now.
 */
export default async function detachSubtask({ task_id, by_bot_id, by_name }: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const task = await grabTaskRow({ task_id });

    if (!task.parent_task_id) {
        throw new AppError(`Task #${task.id} isn't a part of another task.`);
    }

    const res = await BunSQLite.sql({
        sql: `UPDATE tasks SET parent_task_id = NULL, updated_at = ? WHERE id = ?`,
        values: [Date.now(), Number(task.id)],
    });

    if (!res.success) {
        throw new AppError(`Couldn't unlink the task: ${res.msg || res.error}`);
    }

    await addTaskNote({
        task_id: task.id!,
        text: `${by_name} unlinked this from task #${task.parent_task_id}: it's a task of its own now.`,
        author: by_bot_id ? "bot" : "user",
        bot_id: by_bot_id || null,
    });

    return await grabTaskRow({ task_id: task.id! });
}