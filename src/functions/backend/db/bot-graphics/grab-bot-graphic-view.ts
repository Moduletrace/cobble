import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotGraphicView } from "@/src/types";
import { viewerGraphicsSql } from "@/src/utils/bot-graphic-sql";

type Params = {
    graphic_id: number | string;
    user_id: number | string;
};

/**
 * A graphic as its card and page name it (never its HTML, which only
 * `/graphics/<id>` serves), for the user it was made for; null otherwise.
 */
export default async function grabBotGraphicView({ graphic_id, user_id }: Params): Promise<BotGraphicView | null> {
    const reach = viewerGraphicsSql({ alias: "g", user_id });

    const row = (
        await BunSQLite.sql<BotGraphicView & { bot_name: string | null }>({
            sql: `SELECT g.id, g.title, g.version, g.bot_id, g.workspace_id, g.session_id, g.updated_at, b.name AS bot_name
                FROM bot_graphics g LEFT JOIN bots b ON b.id = g.bot_id
                WHERE g.id = ? AND ${reach.sql} LIMIT 1`,
            values: [Number(graphic_id), ...reach.values],
        })
    ).payload?.[0];

    if (!row) return null;

    return {
        id: Number(row.id),
        title: row.title || `Graphic ${row.id}`,
        version: Number(row.version) || 1,
        bot_id: Number(row.bot_id),
        bot_name: row.bot_name || "A bot",
        workspace_id: row.workspace_id ? Number(row.workspace_id) : null,
        session_id: row.session_id ? Number(row.session_id) : null,
        updated_at: Number(row.updated_at) || 0,
    };
}
