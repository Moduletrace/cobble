import BunSQLite from "@moduletrace/bun-sqlite";
import openWorkSql from "./open-work-sql";

type Params = {
    bot_id: number | string;
    session_id: number | string;
};

/**
 * A run of the bot's in this session, a job it handed over from here, or
 * a request it asked from here, still open: its result is still to come. A
 * plan step is an ordinary reply job carrying `params.plan_id`, so it
 * counts too - an honest "step 2 is running" line is not a false claim
 * while that step works (L5). Shared by the reply review gate and the crew
 * request lifecycle, so both read "work is still open" the same way.
 */
export default async function hasOpenWork({ bot_id, session_id }: Params): Promise<boolean> {
    const jobs = await BunSQLite.sql<{ id: number }>(openWorkSql({ bot_id, session_id }));

    if (jobs.payload?.[0]) return true;

    const asks = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM bot_asks WHERE status IN ('pending', 'working') AND requester_bot_id = ? AND origin_session_id = ? LIMIT 1`,
        values: [Number(bot_id), Number(session_id)],
    });

    return Boolean(asks.payload?.[0]);
}
