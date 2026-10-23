import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_MEDIA,
    BUN_SQLITE_COBBLE_TASK_MEDIA,
} from "@/db/types/db";
import grabCrewRole from "../access/grab-crew-role";
import taskScopesSql from "@/src/utils/task-access/task-scopes-sql";

type Params = {
    media_id: number | string;
    user_id: number | string;
};

/**
 * A task file's bytes (its private `media` row) for a user who reaches the
 * task's bot or workspace, the same rule the task list uses. Task media
 * belongs to the crew, like the crew itself, so whoever sees the task sees
 * what it produced.
 */
export default async function grabTaskMediaFile({
    media_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_MEDIA | null> {
    const link = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_MEDIA>({
            sql: `SELECT * FROM task_media WHERE media_id = ? LIMIT 1`,
            values: [Number(media_id)],
        })
    ).payload?.[0];

    if (!link?.task_id) return null;

    const access = taskScopesSql({
        role: await grabCrewRole({ user_id }),
        user_id,
    });

    const task = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT t.id FROM tasks t WHERE t.id = ? AND ${access.sql} LIMIT 1`,
            values: [Number(link.task_id), ...access.values],
        })
    ).payload?.[0];

    if (!task?.id) return null;

    const media = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
            sql: `SELECT * FROM media WHERE id = ? LIMIT 1`,
            values: [Number(media_id)],
        })
    ).payload?.[0];

    return media || null;
}
