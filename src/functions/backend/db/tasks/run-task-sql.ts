import botTaskScopesSql from "@/src/utils/task-access/bot-task-scopes-sql";
import type { SqlCondition } from "@/src/utils/task-access/types";

type Params = {
    task_id: number | string;
    bot_id: number | string;
    is_coordinator: boolean;
    admin_workspace_ids?: number[];
};

/**
 * The read `grabRunTask` makes: the task, but only while the run reaches
 * it. Split out so the reach rules can be run against real SQLite.
 */
export function runTaskSql({ task_id, bot_id, is_coordinator, admin_workspace_ids }: Params): SqlCondition {
    const access = botTaskScopesSql({ bot_id, is_coordinator, admin_workspace_ids });

    return {
        sql: `SELECT t.* FROM tasks t WHERE t.id = ? AND ${access.sql} LIMIT 1`,
        values: [Number(task_id), ...access.values],
    };
}

/**
 * Whether a task row is there at all, which is a different answer from one
 * the run can't reach.
 */
export function taskRowSql({ task_id }: { task_id: number | string }): SqlCondition {
    return { sql: `SELECT id FROM tasks WHERE id = ? LIMIT 1`, values: [Number(task_id)] };
}
