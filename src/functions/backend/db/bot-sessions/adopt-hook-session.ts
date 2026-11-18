import BunSQLite from "@moduletrace/bun-sqlite";
import adoptHookSessionSql from "./adopt-hook-session-sql";

type Params = {
    session_id: number;
};

/**
 * A silent hook's thread stops being the hook's the moment the user writes
 * in it: the thread on screen is theirs to chat in, so it becomes an
 * ordinary conversation (its messages pushed and counted, the bot's face
 * set while it answers), and the hook's next call opens a thread of its
 * own (`ensureHookSession`). Returns whether the session was one of a
 * silent hook's.
 */
export default async function adoptHookSession({ session_id }: Params): Promise<boolean> {
    const { sql, values } = adoptHookSessionSql({ session_id, now: Date.now() });

    const res = await BunSQLite.sql<{ id: number }>({ sql, values });

    if (!res.success) {
        throw new Error(`Couldn't take the session over from its hook: ${res.msg || res.error}`);
    }

    return Boolean(res.payload?.length);
}