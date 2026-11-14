import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    /**
     * The bot that asked.
     */
    bot_id: number | string;
    limit?: number;
};

export type BotAskSummary = {
    id: number;
    title: string;
    status: string;
    target_bot_id: number | null;
    target_name: string | null;
};

/**
 * The requests one bot made to others, newest first, in any place: what a
 * bot reads to answer "did it go out" and "is it back" without guessing.
 */
export default async function grabBotAsks({ user_id, bot_id, limit = 10 }: Params): Promise<BotAskSummary[]> {
    const res = await BunSQLite.sql({
        sql: `SELECT a.id, a.title, a.status, a.target_bot_id, b.name AS target_name
            FROM bot_asks a
            LEFT JOIN bots b ON b.id = a.target_bot_id
            WHERE a.user_id = ? AND a.requester_bot_id = ?
            ORDER BY a.id DESC
            LIMIT ?`,
        values: [user_id, bot_id, Math.min(Math.max(Number(limit) || 10, 1), 20)],
    });

    return (res.payload || []).map((row) => ({
        id: Number(row.id),
        title: row.title ? String(row.title) : "Request",
        status: row.status ? String(row.status) : "pending",
        target_bot_id: row.target_bot_id ? Number(row.target_bot_id) : null,
        target_name: row.target_name ? String(row.target_name) : null,
    }));
}
