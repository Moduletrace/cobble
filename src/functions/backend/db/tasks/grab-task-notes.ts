import BunSQLite from "@moduletrace/bun-sqlite";
import type { TaskNote } from "@/src/types";

type Params = {
    task_id: number | string;
};

/**
 * A task's log, oldest first, each note with the bot that wrote it. The
 * caller checked who is asking reaches the task.
 */
export default async function grabTaskNotes({ task_id }: Params): Promise<TaskNote[]> {
    const res = await BunSQLite.sql<TaskNote>({
        sql: `SELECT n.*, nb.name AS bot_name FROM task_notes n
            LEFT JOIN bots nb ON nb.id = n.bot_id
            WHERE n.task_id = ? ORDER BY n.id ASC`,
        values: [Number(task_id)],
    });

    return res.payload || [];
}
