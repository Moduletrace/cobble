import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * A bot only if it belongs to the given owner.
 */
export default async function grabUserBot({
    bot_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT * FROM bots WHERE id = ? AND user_id = ? LIMIT 1`,
        values: [bot_id, user_id],
    });

    return res.payload?.[0] || null;
}
