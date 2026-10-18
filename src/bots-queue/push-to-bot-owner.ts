import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { WebSocketDataType } from "@/src/types";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    bot_id: number | string;
    data: WebSocketDataType;
};

/**
 * Live update to the bot owner's open tabs. Best effort: nothing is queued
 * for offline users, who see the change on their next page load.
 */
export default async function pushToBotOwner({ bot_id, data }: Params) {
    const bot = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT user_id FROM bots WHERE id = ? LIMIT 1`,
            values: [bot_id],
        })
    ).payload?.[0];

    if (!bot?.user_id) return;

    sendToUser({ user_id: bot.user_id, data });
}
