import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import addTaskNote from "./add-task-note";
import grabTaskHeir from "./grab-task-heir";

type Params = {
    /**
     * The bot leaving. Workspace-wide tasks (no bot) are nobody's and stay.
     */
    bot_id: number | string;
    /**
     * Only its tasks in this workspace; none for every workspace.
     */
    workspace_id?: number | string | null;
    /**
     * Who is leaving, for the note on each task.
     */
    bot_name?: string | null;
};

/**
 * Gives a leaving bot's workspace tasks to the workspace's admin bot, else
 * the coordinator, with a note on each. Its own list is left alone, and so
 * are the workspace-wide ones. Returns how many moved.
 */
export default async function passOnBotTasks({ bot_id, workspace_id, bot_name }: Params) {
    const where = [`workspace_id IS NOT NULL`, `bot_id = ?`];
    const values: number[] = [Number(bot_id)];

    if (workspace_id) {
        where.push(`workspace_id = ?`);
        values.push(Number(workspace_id));
    }

    const tasks =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_TASKS>({
                sql: `SELECT * FROM tasks WHERE ${where.join(" AND ")}`,
                values,
            })
        ).payload || [];

    let moved = 0;

    for (const task of tasks) {
        const heir = await grabTaskHeir({ workspace_id: task.workspace_id!, except_bot_id: bot_id });

        if (!heir?.id) continue;

        await BunSQLite.sql({
            sql: `UPDATE tasks SET bot_id = ?, updated_at = ? WHERE id = ?`,
            values: [Number(heir.id), Date.now(), Number(task.id)],
        });

        await addTaskNote({
            task_id: task.id!,
            text: bot_name ? `${bot_name} left; this is now ${heir.name}'s.` : `This is now ${heir.name}'s.`,
            author: "user",
        }).catch(() => {});

        moved++;
    }

    return moved;
}
