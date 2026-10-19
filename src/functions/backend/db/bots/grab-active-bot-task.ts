import type {
    BUN_SQLITE_COBBLE_BOT_TASK_STEPS,
    BUN_SQLITE_COBBLE_BOT_TASKS,
} from "@/db/types/db";
import type { BotTaskWithSteps } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import grabBotJobUpdates from "../bots-queue/grab-bot-job-updates";

type Params = {
    bot_id: number | string;
    /**
     * Only a task started from this session.
     */
    session_id?: number | string | null;
    /**
     * Only a task in this user's conversations.
     */
    user_id?: number | string | null;
};

/**
 * The bot's most recent active task (in one session or one user's
 * conversations, when given), its
 * steps and what its job has done so far, for the working-on panel.
 */
export default async function grabActiveBotTask({
    bot_id,
    session_id,
    user_id,
}: Params): Promise<BotTaskWithSteps | null> {
    const task_res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_TASKS>({
        sql: `SELECT * FROM bot_tasks WHERE bot_id = ? AND status = 'active'
            ${session_id ? `AND session_id = ?` : ""}
            ${user_id ? `AND session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?)` : ""}
            ORDER BY created_at DESC, id DESC LIMIT 1`,
        values: [bot_id, ...(session_id ? [session_id] : []), ...(user_id ? [user_id] : [])],
    });

    const task = task_res.singleRes || task_res.payload?.[0];

    if (!task?.id) {
        return null;
    }

    const steps_res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_TASK_STEPS>({
        sql: `SELECT * FROM bot_task_steps WHERE task_id = ? ORDER BY position ASC, id ASC`,
        values: [task.id],
    });

    return {
        ...task,
        steps: steps_res.payload || [],
        updates: await grabBotJobUpdates({ task_id: task.id }),
    };
}
