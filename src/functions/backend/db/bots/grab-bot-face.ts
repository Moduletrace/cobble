import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFace } from "@/src/dict/bot-dict";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * A bot's face and status line as one user sees it: idle when it has
 * none for them.
 */
export default async function grabBotFace({ bot_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<{ face: BotFace; status_line: string }>({
            sql: `SELECT face, status_line FROM bot_user_faces WHERE bot_id = ? AND user_id = ? LIMIT 1`,
            values: [bot_id, user_id],
        })
    ).payload?.[0];

    return { face: (row?.face || "idle") as BotFace, status_line: row?.status_line || "" };
}
