import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_GRAPHICS } from "@/db/types/db";
import { viewerGraphicsSql } from "@/src/utils/bot-graphic-sql";

type Params = {
    graphic_id: number | string;
    /**
     * The viewer: only the user it was made for reads it.
     */
    user_id: number | string;
};

/**
 * A graphic with its HTML, for the user it was made for; null for anyone
 * else or a missing one.
 */
export default async function grabBotGraphic({ graphic_id, user_id }: Params) {
    const reach = viewerGraphicsSql({ alias: "g", user_id });

    return (
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_GRAPHICS>({
                sql: `SELECT g.* FROM bot_graphics g WHERE g.id = ? AND ${reach.sql} LIMIT 1`,
                values: [Number(graphic_id), ...reach.values],
            })
        ).payload?.[0] || null
    );
}
