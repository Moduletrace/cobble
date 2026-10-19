import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number;
    media_ids: number[];
};

/**
 * The session user's own uploaded files, in the given order. Throws when
 * any isn't theirs (or no longer exists), so a message can't carry
 * someone else's file.
 */
export default async function grabAttachableMedia({ user_id, media_ids }: Params) {
    const ids = [...new Set(media_ids)];

    if (!ids.length) return [];

    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
                sql: `SELECT * FROM media WHERE user_id = ? AND id IN (${ids.map(() => "?").join(", ")})`,
                values: [user_id, ...ids],
            })
        ).payload || [];

    if (rows.length != ids.length) {
        throw new AppError(`One of the files is gone. Attach it again.`);
    }

    return ids.map((id) => rows.find((row) => row.id == id)!);
}
