import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_GRAPHICS, BunSQLiteTables } from "@/db/types/db";
import checkGraphicInput from "./check-graphic-input";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id?: number | string | null;
    workspace_id?: number | string | null;
    /**
     * The run that made it, so its message is linked once posted.
     */
    job_id?: number | string | null;
    title: string;
    html: string;
};

/**
 * Stores a graphic a bot made for a user. Returns its id.
 */
export default async function createBotGraphic({
    user_id,
    bot_id,
    session_id,
    workspace_id,
    job_id,
    title,
    html,
}: Params) {
    const checked = checkGraphicInput({ title, html });

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_GRAPHICS, (typeof BunSQLiteTables)[number]>({
        table: "bot_graphics",
        data: [
            {
                title: checked.title,
                html: checked.html,
                version: 1,
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: session_id ? Number(session_id) : undefined,
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
                job_id: job_id ? Number(job_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the graphic: ${res.msg}`);

    return id;
}
