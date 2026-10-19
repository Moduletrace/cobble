import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import jobSessionId from "./job-session-id";

type Params = {
    job: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "session_id">;
};

/**
 * The user a job works for: the one whose conversation it's in. Null once
 * that conversation is gone.
 */
export default async function grabJobUserId({ job }: Params) {
    const user_id = (
        await BunSQLite.sql<{ user_id: number }>({
            sql: `SELECT user_id FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [jobSessionId({ job })],
        })
    ).payload?.[0]?.user_id;

    return user_id ? Number(user_id) : null;
}
