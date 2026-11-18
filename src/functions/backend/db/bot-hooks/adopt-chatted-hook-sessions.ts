import BunSQLite from "@moduletrace/bun-sqlite";
import adoptChattedHookSessionsSql from "./adopt-chatted-hook-sessions-sql";

/**
 * Repairs an install that kept the user's real conversation in a silent
 * hook's thread: those threads become the user's own at boot, so their
 * messages reach the user's tabs again and count as activity, while the
 * hook keeps a thread of its own for its next call. Runs once per boot and
 * changes nothing when there is nothing to hand back.
 */
export default async function adoptChattedHookSessions() {
    const { sql, values } = adoptChattedHookSessionsSql({ now: Date.now() });

    const res = await BunSQLite.sql<{ id: number }>({ sql, values });

    if (!res.success) {
        throw new Error(`Couldn't hand the hooks' used threads to their users: ${res.msg || res.error}`);
    }
}