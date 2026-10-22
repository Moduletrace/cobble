import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import taskScopesSql from "@/src/utils/task-access/task-scopes-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    user_id: number | string;
    task_id: number | string;
};

/**
 * The task, if the user reaches its bot or workspace: the one check every
 * user-facing task endpoint makes before reading or changing it. Throws
 * "Task not found" rather than saying a task exists where it doesn't, so
 * an unreachable id reads the same as a missing one.
 */
export default async function assertUserReachesTask({
    user_id,
    task_id,
}: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const access = taskScopesSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>({
        sql: `SELECT t.* FROM tasks t WHERE t.id = ? AND ${access.sql} LIMIT 1`,
        values: [Number(task_id), ...access.values],
    });

    const task = res.payload?.[0];

    if (!task?.id) {
        throw new AppError(`Task not found.`);
    }

    return task;
}
