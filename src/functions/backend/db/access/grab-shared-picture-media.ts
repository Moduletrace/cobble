import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import sharedPictureMediaSql from "./shared-picture-media-sql";

type Params = {
    media_id: number | string;
};

/**
 * A picture every signed-in user may see - a member's current profile photo,
 * a bot's picture, a workspace's picture (`sharedPictureMediaSql`) - or
 * null when this media is something else.
 *
 * Which crew the viewer reaches plays no part: bots and workspaces belong to
 * the install, and people know each other by their photo, so a picture is
 * shared with everyone signed in. Everything a picture must not expose (a
 * bot's files, a task's deliverable, someone's chat upload) stays behind
 * its own check, and a removed picture stops being shared as soon as no
 * user, bot or workspace points at it.
 */
export default async function grabSharedPictureMedia({ media_id }: Params) {
    if (!media_id) return null;

    const condition = sharedPictureMediaSql({ alias: "m" });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
        sql: `SELECT m.* FROM media m WHERE m.id = ? AND COALESCE(m.archived, 0) <> 1 AND ${condition.sql} LIMIT 1`,
        values: [media_id, ...condition.values],
    });

    return res.payload?.[0] || null;
}
