import BunSQLite from "@moduletrace/bun-sqlite";
import type { TaskFile } from "@/src/types";

type Params = {
    task_id: number | string;
};

/**
 * A task's files with what a row shows: the `media` row's type, mime and
 * size, and whether that row is still there (a failed cleanup or a
 * deleted file leaves the link behind, listed as missing rather than
 * hiding it).
 */
export default async function grabTaskMedia({ task_id }: Params): Promise<TaskFile[]> {
    const res = await BunSQLite.sql<TaskFile>({
        sql: `SELECT tm.*, m.media_type, m.mime_type, m.title AS media_title
            FROM task_media tm
            LEFT JOIN media m ON m.id = tm.media_id
            WHERE tm.task_id = ?
            ORDER BY tm.kind ASC, tm.id ASC`,
        values: [Number(task_id)],
    });

    return (res.payload || []).map((file) => ({
        ...file,
        name: file.name || file.media_title || `File ${file.media_id}`,
        missing: !file.media_type,
    }));
}
