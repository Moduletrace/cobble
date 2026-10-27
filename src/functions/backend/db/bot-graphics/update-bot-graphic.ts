import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import { runGraphicsSql } from "@/src/utils/bot-graphic-sql";
import checkGraphicInput from "./check-graphic-input";

type Params = {
    graphic_id: number | string;
    /**
     * The run's bot and user: only the graphics that bot made for that
     * user are changed.
     */
    bot_id: number | string;
    user_id: number | string;
    title?: string;
    html?: string;
};

/**
 * Replaces a graphic's HTML (and title, when given) and bumps its
 * version. Every message naming it shows the new one. Returns its new
 * version.
 */
export default async function updateBotGraphic({ graphic_id, bot_id, user_id, title, html }: Params) {
    const checked = checkGraphicInput({ title, html });

    if (!checked.title && !checked.html) throw new AppError(`Nothing to change: give new html or a title.`);

    const reach = runGraphicsSql({ alias: "bot_graphics", user_id, bot_id });

    const row = (
        await BunSQLite.sql<{ version: number }>({
            sql: `UPDATE bot_graphics SET
                    title = COALESCE(?, title),
                    html = COALESCE(?, html),
                    version = COALESCE(version, 1) + 1,
                    updated_at = ?
                WHERE id = ? AND ${reach.sql}
                RETURNING version`,
            values: [checked.title ?? null, checked.html ?? null, Date.now(), Number(graphic_id), ...reach.values],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`Graphic ${graphic_id} isn't one you made for this user.`);

    return Number(row.version);
}
