import type { BUN_SQLITE_COBBLE_BOT_TASK_STEPS, BUN_SQLITE_COBBLE_BOT_TASKS } from "@/db/types/db";
import type { BotTaskWithSteps } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import grabBotJobUpdates from "../bots-queue/grab-bot-job-updates";

type Params = {
    task: BUN_SQLITE_COBBLE_BOT_TASKS;
};

/**
 * A `bot_tasks` row with its steps and what its job has done so far, for
 * the working-on panel: what one active task is read as, whether it's the
 * newest of its bot or one of several in different conversations.
 */
export default async function withBotTaskSteps({ task }: Params): Promise<BotTaskWithSteps> {
    const steps_res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_TASK_STEPS>({
        sql: `SELECT * FROM bot_task_steps WHERE task_id = ? ORDER BY position ASC, id ASC`,
        values: [Number(task.id)],
    });

    return {
        ...task,
        steps: steps_res.payload || [],
        updates: await grabBotJobUpdates({ task_id: Number(task.id) }),
    };
}