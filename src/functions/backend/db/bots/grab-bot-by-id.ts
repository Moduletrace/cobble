import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
};

/**
 * A bot by id, whoever owns it. Server-side work only (the queue); request
 * handlers use `grabUserBot` to check ownership.
 */
export default async function grabBotById({
    bot_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT * FROM bots WHERE id = ? LIMIT 1`,
        values: [bot_id],
    });

    return res.payload?.[0] || null;
}
