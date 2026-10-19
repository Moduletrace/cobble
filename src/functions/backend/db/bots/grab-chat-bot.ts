import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import chatBotsSql from "@/src/utils/crew-access/chat-bots-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * A bot only if the user chats with it in its own chat (`chatBotsSql`).
 */
export default async function grabChatBot({
    bot_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS | null> {
    const access = chatBotsSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT b.* FROM bots b WHERE b.id = ? AND ${access.sql} LIMIT 1`,
        values: [bot_id, ...access.values],
    });

    return res.payload?.[0] || null;
}
