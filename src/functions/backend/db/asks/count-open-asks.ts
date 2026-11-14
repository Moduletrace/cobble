import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    requester_bot_id: number | string;
};

/**
 * The requests one bot has open for a user: waiting on the gate, or out with
 * another bot. Capped by `AppData.AskMaxOpenPerBot` so one run can't fan out.
 */
export default async function countOpenAsks({ user_id, requester_bot_id }: Params) {
    const res = await BunSQLite.sql<{ n: number }>({
        sql: `SELECT COUNT(*) AS n FROM bot_asks
            WHERE user_id = ? AND requester_bot_id = ? AND status IN ('pending', 'working')`,
        values: [Number(user_id), Number(requester_bot_id)],
    });

    return Number(res.payload?.[0]?.n) || 0;
}
