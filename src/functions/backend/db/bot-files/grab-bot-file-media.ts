import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_FILES,
    BUN_SQLITE_COBBLE_MEDIA,
} from "@/db/types/db";
import userReachesFileScope from "./user-reaches-file-scope";

type Params = {
    media_id: number | string;
    user_id: number | string;
};

/**
 * A bot file's bytes (its private `media` row) for a user who reaches the
 * directory it's in: the bot's own chat (or any worker, for super admins
 * and admins; the coordinator only for the super admin), or the workspace
 * it's shared in. Files belong to the install, like the crew, so whoever
 * sees the bot sees what it saved.
 */
export default async function grabBotFileMedia({
    media_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_MEDIA | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT * FROM bot_files WHERE media_id = ? LIMIT 1`,
        values: [media_id],
    });

    const file = res.payload?.[0];

    if (!file?.id) return null;

    if (!(await userReachesFileScope({ scope: file.scope, owner_id: file.owner_id, user_id }))) return null;

    const media = await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
        sql: `SELECT * FROM media WHERE id = ? LIMIT 1`,
        values: [media_id],
    });

    return media.payload?.[0] || null;
}
