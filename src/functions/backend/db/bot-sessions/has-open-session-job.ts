import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
};

/**
 * Whether the bot still has work queued or running in a session, whose
 * answer lands there: a session isn't carried over meanwhile.
 */
export default async function hasOpenSessionJob({ session_id }: Params) {
    return Boolean(
        (
            await BunSQLite.sql({
                sql: `SELECT id FROM bots_queue WHERE session_id = ? AND status IN ('pending', 'processing') LIMIT 1`,
                values: [session_id],
            })
        ).payload?.[0],
    );
}
