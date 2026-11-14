import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import deleteSessionRows from "../bot-sessions/delete-session-rows";

type Params = {
    asks: Pick<BUN_SQLITE_COBBLE_BOT_ASKS, "id">[];
};

/**
 * Deletes asks and everything their runs left behind, children first:
 * each ask's sessions with their jobs and messages (`deleteSessionRows`),
 * then the asks themselves.
 */
export default async function deleteAskRows({ asks }: Params) {
    const ids = asks.map((ask) => Number(ask.id)).filter(Boolean);

    if (!ids.length) return;

    const placeholders = ids.map(() => "?").join(", ");

    const sessions = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bot_sessions WHERE ask_id IN (${placeholders})`,
            values: ids,
        })
    ).payload || [];

    await deleteSessionRows({ session_ids: sessions.map((session) => Number(session.id)) });

    await BunSQLite.sql({
        sql: `DELETE FROM bot_asks WHERE id IN (${placeholders})`,
        values: ids,
    });
}
