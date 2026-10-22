import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";

type Params = {
    media_id: number | string;
    /**
     * Who it has to belong to: a bot may only show a picture the user the
     * run is for uploaded, never someone else's.
     */
    user_id: number | string;
};

/**
 * One of a user's own media rows, for use as a bot's or workspace's
 * picture, or null when it isn't theirs (or no longer exists). The file
 * type is checked by the caller (`resolveWorkspacePicture`), so a
 * document is never taken as a picture.
 */
export default async function grabOwnPictureMedia({ media_id, user_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
        sql: `SELECT * FROM media WHERE id = ? AND user_id = ? LIMIT 1`,
        values: [Number(media_id), Number(user_id)],
    });

    return res.payload?.[0] || null;
}
