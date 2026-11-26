import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";

type Params = {
    ask_id: number | string;
    outcome: string;
};

/**
 * Turns a request that failed too early into an answered one once a run
 * that was working on it comes back with a result: the answer run can die
 * after it had already queued the work, and the request must not stay
 * recorded as failed when an answer exists. Only flips a `failed` row, so
 * a stopped or answered request is never reopened; null when something
 * else ended it in the meantime.
 */
export default async function reopenFailedAskAnswered({ ask_id, outcome }: Params): Promise<BUN_SQLITE_COBBLE_BOT_ASKS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: `UPDATE bot_asks SET status = 'answered', outcome = ?, updated_at = ?
            WHERE id = ? AND status = 'failed' RETURNING *`,
        values: [outcome, Date.now(), Number(ask_id)],
    });

    return res.payload?.[0] || null;
}
