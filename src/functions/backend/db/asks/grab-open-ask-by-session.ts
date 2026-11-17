import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";

type Params = {
    /**
     * The conversation to look up: a crew request's answer runs in its own
     * session, recorded on the request as `session_id`.
     */
    session_id: number | string;
    /**
     * Only if it's this user's, when the caller knows them.
     */
    user_id?: number | string;
};

/**
 * The open crew request this session is answering, if any. An answer runs
 * in a normal visible session of the target bot's conversation, linked to
 * the request by `bot_asks.session_id` (the session's own `ask_id` stays
 * null - that column marks only the gate's hidden review session). This is
 * how a follow-up reply, a `start_task` or an interim update in that thread
 * knows it is still part of the request. Null once the request has ended.
 */
export default async function grabOpenAskBySession({
    session_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_ASKS | null> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: user_id
            ? `SELECT * FROM bot_asks WHERE session_id = ? AND user_id = ? AND status IN ('pending', 'working') ORDER BY id DESC LIMIT 1`
            : `SELECT * FROM bot_asks WHERE session_id = ? AND status IN ('pending', 'working') ORDER BY id DESC LIMIT 1`,
        values: user_id ? [Number(session_id), Number(user_id)] : [Number(session_id)],
    });

    return res.payload?.[0] || null;
}
