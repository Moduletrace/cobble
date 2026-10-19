import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_MEDIA, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import grabUserBot from "../bots/grab-user-bot";
import grabUserWorkspace from "../workspaces/grab-user-workspace";

type Params = {
    media_id: number | string;
    user_id: number | string;
};

/**
 * A bot's or workspace's picture (private media, uploaded by whoever set
 * it) for a user who reaches that bot or workspace, or null. Bots and
 * workspaces belong to the install, so their pictures show to everyone
 * who sees them.
 */
export default async function grabSharedPictureMedia({ media_id, user_id }: Params) {
    const [bot, workspace] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT id FROM bots WHERE image_media_id = ? LIMIT 1`,
            values: [media_id],
        }).then((res) => res.payload?.[0]),
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT id FROM workspaces WHERE image_media_id = ? LIMIT 1`,
            values: [media_id],
        }).then((res) => res.payload?.[0]),
    ]);

    const allowed =
        (bot?.id && (await grabUserBot({ bot_id: bot.id, user_id }))?.id) ||
        (workspace?.id && (await grabUserWorkspace({ workspace_id: workspace.id, user_id }))?.id);

    if (!allowed) return null;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
        sql: `SELECT * FROM media WHERE id = ? LIMIT 1`,
        values: [media_id],
    });

    return res.payload?.[0] || null;
}
