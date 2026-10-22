import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { TaskStatus } from "@/src/dict/task-dict";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import grabCrewRole from "../access/grab-crew-role";
import grabTask from "./grab-task";
import grabTaskRow, { isOpenTask } from "./grab-task-scope";

type Params = {
    user_id: number | string;
    task_id: number | string;
    title?: string;
    description?: string;
    status?: TaskStatus;
    /**
     * What the user has to do to unblock it. Cleared when the status leaves
     * `blocked`.
     */
    blocked_reason?: string | null;
    /**
     * The bot's run changing it; none for the user. Either way, the caller
     * checked the run or user reaches it.
     */
    updated_by_bot_id?: number | string | null;
};

/**
 * Changes a task's title, brief or status. Moving it to done or cancelled
 * stamps `completed_at`; moving it back to an open status clears it.
 * `blocked_reason` only survives while the task is blocked.
 */
export default async function updateTask({
    user_id,
    task_id,
    title,
    description,
    status,
    blocked_reason,
    updated_by_bot_id,
}: Params): Promise<TaskDetail> {
    /**
     * Tasks are crew structure like bots and workspaces: an admin changes
     * them by hand, a bot's run changes its own.
     */
    if (!updated_by_bot_id && (await grabCrewRole({ user_id })) == "member") {
        throw new AppError(`Only an admin can change a task.`);
    }

    const task = await grabTaskRow({ task_id });
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (title != null) {
        fields.push(`title = ?`);
        values.push(String(title).trim().slice(0, AppData.TaskTitleMaxLength));
    }

    if (description != null) {
        fields.push(`description = ?`);
        values.push(String(description).slice(0, AppData.TaskDescriptionMaxLength));
    }

    if (status != null) {
        fields.push(`status = ?`);
        values.push(status);
        fields.push(`completed_at = ?`);
        values.push(isOpenTask({ status }) ? null : Date.now());

        if (status != "blocked") {
            fields.push(`blocked_reason = ?`);
            values.push(null);
        }
    }

    if (blocked_reason !== undefined && (status ?? task.status) == "blocked") {
        fields.push(`blocked_reason = ?`);
        values.push(blocked_reason ? String(blocked_reason).slice(0, AppData.TaskNoteMaxLength) : null);
    }

    if (!fields.length) {
        return await grabTask({ user_id, task_id });
    }

    const res = await BunSQLite.sql({
        sql: `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
        values: [...values, Number(task_id)],
    });

    if (!res.success) {
        throw new AppError(`Couldn't save the task: ${res.msg || res.error}`);
    }

    return await grabTask({ user_id, task_id });
}
