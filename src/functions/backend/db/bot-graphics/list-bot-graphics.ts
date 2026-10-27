import BunSQLite from "@moduletrace/bun-sqlite";
import { runGraphicsSql } from "@/src/utils/bot-graphic-sql";

type Params = {
    bot_id: number | string;
    user_id: number | string;
    /**
     * The place: a workspace, or null for the bot's own chat.
     */
    workspace_id?: number | string | null;
    limit?: number;
};

/**
 * The graphics a bot made for a user in one place, newest first, without
 * their HTML.
 */
export default async function listBotGraphics({ bot_id, user_id, workspace_id, limit = 20 }: Params) {
    const reach = runGraphicsSql({ alias: "g", user_id, bot_id });

    return (
        (
            await BunSQLite.sql<{ id: number; title: string; version: number; updated_at: number; chars: number }>({
                sql: `SELECT g.id, g.title, g.version, g.updated_at, LENGTH(g.html) AS chars FROM bot_graphics g
                    WHERE ${reach.sql} AND g.workspace_id IS ?
                    ORDER BY g.updated_at DESC, g.id DESC LIMIT ?`,
                values: [...reach.values, workspace_id ? Number(workspace_id) : null, limit] as (string | number)[],
            })
        ).payload || []
    );
}
