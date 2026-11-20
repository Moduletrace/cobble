import type { BUN_SQLITE_COBBLE_BOT_TASKS } from "@/db/types/db";
import type { BotTaskWithSteps } from "@/src/types";
import BunSQLite from "@moduletrace/bun-sqlite";
import withBotTaskSteps from "./with-bot-task-steps";

type Params = {
    bot_id: number | string;
    /**
     * Only tasks in this user's conversations.
     */
    user_id?: number | string | null;
};

/**
 * How many active tasks a push carries. A bot has at most one run per
 * computer and one reply per session, so a handful of conversations are
 * ever running at once; the newest few are enough for a viewer to find its
 * own, and a list that grows with the whole crew's history is not.
 */
const BotActiveTasksShown = 10;

/**
 * Every active task the user has with the bot, newest first. A push can't
 * know which conversation the viewer is looking at, and sending only the
 * newest left the one they were reading with no task at all whenever
 * another run was open elsewhere (`use-task-progress` drops a task from
 * another session), so the page is sent them all and picks its own.
 */
export default async function grabActiveBotTasks({ bot_id, user_id }: Params): Promise<BotTaskWithSteps[]> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_TASKS>({
        sql: `SELECT * FROM bot_tasks WHERE bot_id = ? AND status = 'active'
            ${user_id ? `AND session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?)` : ""}
            ORDER BY created_at DESC, id DESC LIMIT ${BotActiveTasksShown}`,
        values: [bot_id, ...(user_id ? [user_id] : [])],
    });

    const tasks = res.payload || [];

    return await Promise.all(tasks.map((task) => withBotTaskSteps({ task })));
}