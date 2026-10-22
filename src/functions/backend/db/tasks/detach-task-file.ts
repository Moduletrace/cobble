import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_TASK_MEDIA } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import deleteMedia from "../media/delete-media";

type Params = {
    task_id: number | string;
    /**
     * The link's own id, or the media it points at.
     */
    task_media_id?: number | string | null;
    media_id?: number | string | null;
    user_id: number | string;
};

/**
 * Unlinks one file from a task. A chat upload that no other task or
 * message uses has its bytes deleted with it; a bot file keeps its bytes
 * in its folder, which is the file's real home.
 */
export default async function detachTaskFile({
    task_id,
    task_media_id,
    media_id,
    user_id,
}: Params) {
    const link = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_TASK_MEDIA>({
            sql: `SELECT * FROM task_media WHERE task_id = ? AND ${
                task_media_id ? "id = ?" : "media_id = ?"
            } LIMIT 1`,
            values: [Number(task_id), Number(task_media_id || media_id)],
        })
    ).payload?.[0];

    if (!link?.id) {
        throw new AppError(`That file isn't on this task.`);
    }

    const res = await BunSQLite.sql({
        sql: `DELETE FROM task_media WHERE id = ?`,
        values: [Number(link.id)],
    });

    if (!res.success) {
        throw new AppError(`Couldn't unlink the file: ${res.msg || res.error}`);
    }

    if (!link.bot_file_id && link.media_id) {
        const still_used = (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM task_media WHERE media_id = ?`,
                values: [Number(link.media_id)],
            })
        ).payload?.[0]?.n;

        const in_messages = (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM bot_message_media WHERE media_id = ?`,
                values: [Number(link.media_id)],
            })
        ).payload?.[0]?.n;

        if (!Number(still_used || 0) && !Number(in_messages || 0)) {
            await deleteMedia({ id: link.media_id, user_id, can_delete_all_media: true }).catch(() => {});
        }
    }

    return link;
}
