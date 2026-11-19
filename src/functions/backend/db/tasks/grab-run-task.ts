import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import { runTaskSql, taskRowSql } from "./run-task-sql";
import runTaskProblem from "./run-task-problem";

type Params = {
    task_id: number | string;
    /**
     * The bot whose run is asking.
     */
    bot_id: number | string;
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of (`grabBotRunPowers`).
     */
    admin_workspace_ids?: number[];
};

/**
 * The task, if the bot's run reaches it: its own, a workspace it works in,
 * or anything at all for the coordinator. The gate every task tool makes
 * before reading or changing one, so a tool argument can never widen a
 * run's reach. A task that isn't there and one the run can't reach are
 * told apart: told only "isn't one you can work on", a bot filled the gap
 * with a story about permissions and a task that was still there.
 */
export default async function grabRunTask({
    task_id,
    bot_id,
    is_coordinator,
    admin_workspace_ids,
}: Params): Promise<BUN_SQLITE_COBBLE_TASKS> {
    const read = runTaskSql({ task_id, bot_id, is_coordinator, admin_workspace_ids });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>(read);

    const task = res.payload?.[0];

    if (task?.id) return task;

    const exists = await BunSQLite.sql<{ id: number }>(taskRowSql({ task_id }));

    throw new AppError(runTaskProblem({ task_id, exists: Boolean(exists.payload?.[0]?.id) }));
}
