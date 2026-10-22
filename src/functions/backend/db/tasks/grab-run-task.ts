import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import botTaskScopesSql from "@/src/utils/task-access/bot-task-scopes-sql";

type Params = {
    task_id: number | string;
    /**
     * The bot whose run is asking.
     */
    bot_id: number | string;
    is_coordinator: boolean;
};

/**
 * The task, if the bot's run reaches it: its own, a workspace it works in,
 * or anything at all for the coordinator. The gate every task tool makes
 * before reading or changing one, so a tool argument can never widen a
 * run's reach.
 */
export default async function grabRunTask({
    task_id,
    bot_id,
    is_coordinator,
}: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const access = botTaskScopesSql({ bot_id, is_coordinator });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>({
        sql: `SELECT t.* FROM tasks t WHERE t.id = ? AND ${access.sql} LIMIT 1`,
        values: [Number(task_id), ...access.values],
    });

    const task = res.payload?.[0];

    if (!task?.id) {
        throw new AppError(`Task #${task_id} isn't one you can work on.`);
    }

    return task;
}
