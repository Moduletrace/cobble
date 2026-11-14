import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";

/**
 * The install's one coordinator, whichever user owns it. Server-side work
 * only; request handlers reach it through the user's crew.
 */
export default async function grabCoordinatorBot(): Promise<BUN_SQLITE_COBBLE_BOTS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT * FROM bots WHERE kind = 'coordinator' LIMIT 1`,
    });

    return res.payload?.[0] || null;
}
