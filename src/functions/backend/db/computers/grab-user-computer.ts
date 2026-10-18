import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    computer_id: number | string;
    user_id: number | string;
};

/**
 * A computer only if it belongs to the given owner.
 */
export default async function grabUserComputer({
    computer_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_COMPUTERS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
        sql: `SELECT * FROM computers WHERE id = ? AND user_id = ? LIMIT 1`,
        values: [computer_id, user_id],
    });

    return res.payload?.[0] || null;
}
