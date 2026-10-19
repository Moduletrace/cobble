import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    after_id: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-message` for every message newer than `after_id` to
 * its owner's sockets on this process. Returns the newest id read.
 */
export default async function relayNewBotMessages({ after_id, users }: Params) {
    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_MESSAGES & { user_id: number }>({
                sql: `SELECT m.*, b.user_id FROM bot_messages m JOIN bots b ON b.id = m.bot_id
                    WHERE m.id > ? ORDER BY m.id ASC LIMIT 500`,
                values: [after_id],
            })
        ).payload || [];

    for (const { user_id, ...message } of rows) {
        if (users.has(String(user_id))) {
            sendToUser({ user_id, data: { event: "server:bot-message", data: message } });
        }
    }

    return Number(rows[rows.length - 1]?.id) || after_id;
}
