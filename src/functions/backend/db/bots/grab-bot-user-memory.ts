import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_USER_MEMORIES } from "@/db/types/db";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * What a bot remembers about one user, or null when it has nothing yet.
 * The caller checks the user may talk to the bot.
 */
export default async function grabBotUserMemory({ bot_id, user_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_USER_MEMORIES>({
        sql: `SELECT memory FROM bot_user_memories WHERE bot_id = ? AND user_id = ? LIMIT 1`,
        values: [bot_id, user_id],
    });

    return res.payload?.[0]?.memory || null;
}
