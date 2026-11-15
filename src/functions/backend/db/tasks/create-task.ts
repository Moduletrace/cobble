import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { TaskStatus } from "@/src/dict/task-dict";
import type { TaskDetail } from "@/src/types";
import AppError from "@/src/utils/app-error";
import grabCrewRole from "../access/grab-crew-role";
import grabTask from "./grab-task";
import assertBotWorksThere from "./assert-bot-works-there";
import assertSubtaskParent from "./assert-subtask-parent";
import grabSubtaskCounts from "./grab-subtask-counts";
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
     * In a workspace, nobody's: every bot working there sees it and works on
     * it (`taskScopeValues`). Only when asked for.
     */
    workspace_wide?: boolean;
    /**
     * The workspace-wide task this one is a part of (`assertSubtaskParent`):
     * one piece of that work, a bot's own task in the same workspace.
     */
    parent_task_id?: number | string | null;
    /**
     * The bot creating it with its tool; none for a user's manual add.
     */
    created_by_bot_id?: number | string | null;
};

/**
 * Adds a task to a bot's own list or a workspace's, there for one of its
 * bots (`bot_id` too), or workspace-wide when asked (`workspace_wide`). A user adds one to a bot they chat with or
 * a workspace they're in; a bot's run adds one to its own list or to a
 * workspace it works in (its tool checks that). A workspace's task can
 * only go to a bot working there. Caps a list at `TaskMaxPerScope` open and
 * finished tasks.
 */
export default async function createTask({
    user_id,
    bot_id,
    workspace_id,
    title,
    description,
    status,
    workspace_wide,
    parent_task_id,
    created_by_bot_id,
}: Params): Promise<TaskDetail> {
    const scope = taskScopeValues({ bot_id, workspace_id, workspace_wide });
    const role = await grabCrewRole({ user_id });

    if (!created_by_bot_id && role == "member") {
        throw new AppError(`Only an admin can add a task.`);
    }

    if (scope.bot_id && scope.workspace_id) {
        await assertBotWorksThere({ bot_id: scope.bot_id, workspace_id: scope.workspace_id });
    }

    if (parent_task_id) {
        await assertSubtaskParent({ parent_task_id, bot_id: scope.bot_id, workspace_id: scope.workspace_id });

        const { linked } = await grabSubtaskCounts({ task_id: parent_task_id });

        if (linked >= AppData.TaskSubtaskMaxPerParent) {
            throw new AppError(
                `Task #${parent_task_id} already has ${AppData.TaskSubtaskMaxPerParent} parts: work on one of those, or unlink one first.`,
            );
        }
    }

    const count = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM tasks WHERE ${
                    scope.workspace_id ? `workspace_id = ?` : `bot_id = ? AND workspace_id IS NULL`
                }`,
                values: [Number(scope.workspace_id || scope.bot_id)],
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
                parent_task_id: parent_task_id ? Number(parent_task_id) : undefined,
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
