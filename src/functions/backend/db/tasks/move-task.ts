import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import assertBotWorksThere from "./assert-bot-works-there";
import findDuplicateTask from "./find-duplicate-task";
import grabTaskRow from "./grab-task-scope";
import taskScopeValues from "./task-scope-values";

type Params = {
    task_id: number | string;
    /**
     * Where it goes: a bot's own list (`bot_id` alone), or a workspace,
     * with the bot that has it there (always one).
     */
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * Moves a task to another list or bot, with its notes and files. Refused
 * when it changes list and the destination already has an open task with
 * that title, so a hand-over never leaves two of the same. The caller checked who is
 * asking reaches both. Returns the row as it is now.
 */
export default async function moveTask({ task_id, bot_id, workspace_id }: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const task = await grabTaskRow({ task_id });
    const place = taskScopeValues({ bot_id, workspace_id });

    if (Number(task.bot_id || 0) == Number(place.bot_id || 0) && Number(task.workspace_id || 0) == Number(place.workspace_id || 0)) {
        return task;
    }

    if (place.bot_id && place.workspace_id) {
        await assertBotWorksThere({ bot_id: place.bot_id, workspace_id: place.workspace_id });
    }

    const same_list = Number(task.workspace_id || 0) == Number(place.workspace_id || 0) && Boolean(place.workspace_id);

    const there = same_list ? [] : (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>({
            sql: place.workspace_id
                ? `SELECT * FROM tasks WHERE workspace_id = ? AND id != ?`
                : `SELECT * FROM tasks WHERE bot_id = ? AND workspace_id IS NULL AND id != ?`,
            values: [Number(place.workspace_id || place.bot_id), Number(task.id)],
        })
    ).payload || [];

    const duplicate = findDuplicateTask({ tasks: there, title: task.title || "", ...place });

    if (duplicate) {
        throw new AppError(`That list already has task #${duplicate.id} "${duplicate.title}" open. Hand that one over instead.`);
    }

    const res = await BunSQLite.sql({
        sql: `UPDATE tasks SET bot_id = ?, workspace_id = ?, updated_at = ? WHERE id = ?`,
        values: [place.bot_id, place.workspace_id, Date.now(), Number(task.id)],
    });

    if (!res.success) {
        throw new AppError(`Couldn't move the task: ${res.msg || res.error}`);
    }

    return await grabTaskRow({ task_id });
}
