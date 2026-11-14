import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS, BUN_SQLITE_COBBLE_BOT_SESSIONS, BunSQLiteTables } from "@/db/types/db";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    bot_id: number | string;
};

/**
 * The session one bot keeps its part of an ask in: the coordinator's review,
 * then the asked bot's incoming brief and answer. Hidden from every
 * conversation and session list (`visibleSessionSql`), and never opened by a
 * user.
 */
export default async function ensureAskSession({ ask, bot_id }: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const existing = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
        sql: `SELECT * FROM bot_sessions WHERE ask_id = ? AND bot_id = ? ORDER BY id ASC LIMIT 1`,
        values: [ask.id!, Number(bot_id)],
    });

    if (existing.payload?.[0]?.id) return existing.payload[0];

    const now = Date.now();

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_SESSIONS, (typeof BunSQLiteTables)[number]>({
        table: "bot_sessions",
        data: [
            {
                user_id: ask.user_id,
                bot_id: Number(bot_id),
                workspace_id: ask.workspace_id || undefined,
                ask_id: ask.id,
                status: "ask",
                title: ask.title || undefined,
                unread: 0,
                last_activity_at: now,
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't start the session for this request: ${res.msg}`);
    }

    return {
        id,
        user_id: ask.user_id,
        bot_id: Number(bot_id),
        workspace_id: ask.workspace_id || undefined,
        ask_id: ask.id,
        status: "ask",
        title: ask.title || undefined,
        unread: 0,
        last_activity_at: now,
        created_at: now,
        updated_at: now,
    };
}
