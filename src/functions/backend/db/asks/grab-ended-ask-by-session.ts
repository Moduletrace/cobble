import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";

type Params = {
    /**
     * The conversation to look up: a crew request's answer ran in its own
     * session, recorded on the request as `session_id`.
     */
    session_id: number | string;
    /**
     * Only if it's this user's, when the caller knows them.
     */
    user_id?: number | string;
};

/**
 * The request this session answered, once it has ended (answered, stopped
 * or failed): the mirror of `grabOpenAskBySession`. A chat here after the
 * end is the one place a late or corrected answer is written, so this is
 * how the run knows to offer `answer_requester` instead of letting the
 * bot open a fresh request through the gate for what belongs to this one.
 */
export default async function grabEndedAskBySession({
    session_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_ASKS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: user_id
            ? `SELECT * FROM bot_asks WHERE session_id = ? AND user_id = ? AND status NOT IN ('pending', 'working') ORDER BY id DESC LIMIT 1`
            : `SELECT * FROM bot_asks WHERE session_id = ? AND status NOT IN ('pending', 'working') ORDER BY id DESC LIMIT 1`,
        values: user_id ? [Number(session_id), Number(user_id)] : [Number(session_id)],
    });

    return res.payload?.[0] || null;
}
