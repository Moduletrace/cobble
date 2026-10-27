import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";

/**
 * The install's one coordinator, whoever reaches it. Server-side work only
 * (chatrooms, where it works for the room's user).
 */
export default async function grabCoordinatorBot(): Promise<BUN_SQLITE_COBBLE_BOTS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT * FROM bots WHERE kind = 'coordinator' ORDER BY id ASC LIMIT 1`,
    });

    return res.payload?.[0] || null;
}
