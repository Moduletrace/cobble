import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
};

/**
 * How many replies are still to come in a session: its queued ones and the
 * one being written. Zero means nothing will answer there any more, which
 * is how a thread tells a reply that ended without a word (a run that found
 * every message already answered) from one still on its way.
 */
export default async function grabSessionOpenReplies({ session_id }: Params): Promise<number> {
    const row = (
        await BunSQLite.sql<{ count: number }>({
            sql: `SELECT COUNT(*) AS count FROM bots_queue
                WHERE session_id = ? AND kind = 'reply' AND status IN ('pending', 'processing')`,
            values: [Number(session_id)],
        })
    ).payload?.[0];

    return Number(row?.count) || 0;
}