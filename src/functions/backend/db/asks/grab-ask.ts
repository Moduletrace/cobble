import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";

type Params = {
    ask_id: number | string;
    /**
     * Only if it's this user's: the gate, the answer and the outcome all
     * belong to the user whose work it is.
     */
    user_id?: number | string;
};

/**
 * One crew request, with or without its user checked.
 */
export default async function grabAsk({ ask_id, user_id }: Params): Promise<BUN_SQLITE_COBBLE_BOT_ASKS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: user_id
            ? `SELECT * FROM bot_asks WHERE id = ? AND user_id = ? LIMIT 1`
            : `SELECT * FROM bot_asks WHERE id = ? LIMIT 1`,
        values: user_id ? [Number(ask_id), Number(user_id)] : [Number(ask_id)],
    });

    return res.payload?.[0] || null;
}
