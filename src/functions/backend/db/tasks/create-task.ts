import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { TaskStatus } from "@/src/dict/task-dict";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import grabCrewRole from "../access/grab-crew-role";
import grabTask from "./grab-task";
import taskScopeValues from "./task-scope-values";

type Params = {
    /**
     * The user whose run or request creates it.
     */
    user_id: number | string;
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
    title: string;
    description?: string;
    status?: TaskStatus;
    /**
     * The bot creating it with its tool; none for a user's manual add.
     */
    created_by_bot_id?: number | string | null;
};

/**
 * Adds a task to a bot's own list or a workspace's shared one. A user adds
 * one to a bot they chat with or a workspace they're in; a bot's run adds
 * one to its own list or to a workspace it works in (its tool checks
 * that). Caps a collection at `TaskMaxPerScope` open and finished tasks.
 */
export default async function createTask({
    user_id,
    bot_id,
    workspace_id,
    title,
    description,
    status,
    created_by_bot_id,
}: Params): Promise<TaskDetail> {
    const scope = taskScopeValues({ bot_id, workspace_id });
    const role = await grabCrewRole({ user_id });

    if (!created_by_bot_id && role == "member") {
        throw new AppError(`Only an admin can add a task.`);
    }

    const count = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM tasks WHERE ${
                    scope.bot_id ? `bot_id = ?` : `workspace_id = ?`
                }`,
                values: [Number(scope.bot_id || scope.workspace_id)],
            })
        ).payload?.[0]?.n || 0,
    );

    if (count >= AppData.TaskMaxPerScope) {
        throw new AppError(`That list is full (${AppData.TaskMaxPerScope} tasks). Finish or delete one first.`);
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_TASKS, (typeof BunSQLiteTables)[number]>({
        table: "tasks",
        data: [
            {
                bot_id: scope.bot_id || undefined,
                workspace_id: scope.workspace_id || undefined,
                title: title.trim().slice(0, AppData.TaskTitleMaxLength),
                description: description || undefined,
                status: status || "todo",
                origin: created_by_bot_id ? "bot" : "user",
                created_by_bot_id: created_by_bot_id ? Number(created_by_bot_id) : undefined,
                created_by_user_id: Number(user_id),
            },
        ],
    });

    const task_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !task_id) {
        throw new Error(`Couldn't save the task: ${res.msg}`);
    }

    return await grabTask({ user_id, task_id });
}
