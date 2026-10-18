import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFace } from "@/src/dict/bot-dict";

type Params = {
    bot_id: number | string;
    face: BotFace;
    status_line?: string;
};

/**
 * Sets a bot's face (its status) and status line. Callers must check the
 * bot first.
 */
export default async function setBotFace({
    bot_id,
    face,
    status_line = "",
}: Params) {
    await BunSQLite.sql({
        sql: `UPDATE bots SET face = ?, status_line = ?, updated_at = ? WHERE id = ?`,
        values: [face, status_line, Date.now(), bot_id],
    });

    return { id: Number(bot_id), face, status_line };
}
