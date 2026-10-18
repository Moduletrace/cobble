import type {
    BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
    BUN_SQLITE_COBBLE_BOT_TASKS,
} from "@/db/types/db";
import type { BotTaskWithSteps } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
};

/**
 * The bot's most recent active task and its steps, for the working-on panel.
 */
export default async function grabActiveBotTask({
    bot_id,
}: Params): Promise<BotTaskWithSteps | null> {
    const task_res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_TASKS>({
        sql: `SELECT * FROM bot_tasks WHERE bot_id = ? AND status = 'active' ORDER BY created_at DESC, id DESC LIMIT 1`,
        values: [bot_id],
    });

    const task = task_res.singleRes || task_res.payload?.[0];

    if (!task?.id) {
        return null;
    }

    const steps_res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_TASK_STEPS>({
        sql: `SELECT * FROM bot_task_steps WHERE task_id = ? ORDER BY position ASC, id ASC`,
        values: [task.id],
    });

    return { ...task, steps: steps_res.payload || [] };
}
