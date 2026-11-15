import BunSQLite from "@moduletrace/bun-sqlite";
import { OpenTaskStatuses } from "@/src/dict/task-dict";

type Params = {
    task_id: number | string;
};

/**
 * How many tasks are subtasks of this one, and how many of those still need
 * work: what the move and delete checks read (`subtaskMoveProblem`,
 * `subtaskDeleteProblem`) and what a list shows as its progress.
 */
export default async function grabSubtaskCounts({ task_id }: Params): Promise<{ linked: number; open: number }> {
    const res = await BunSQLite.sql<{ linked: number; open: number }>({
        sql: `SELECT COUNT(*) AS linked,
                COALESCE(SUM(CASE WHEN status IN (${OpenTaskStatuses.map(() => "?").join(", ")}) THEN 1 ELSE 0 END), 0) AS open
            FROM tasks WHERE parent_task_id = ?`,
        values: [...OpenTaskStatuses, Number(task_id)],
    });

    const row = res.payload?.[0];

    return { linked: Number(row?.linked || 0), open: Number(row?.open || 0) };
}