import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
};

/**
 * How many of a bot's jobs are still pending or processing.
 */
export default async function countOpenBotJobs({ bot_id }: Params) {
    const res = await BunSQLite.sql<{ open: number }>({
        sql: `SELECT COUNT(*) AS open FROM bots_queue WHERE bot_id = ? AND status IN ('pending', 'processing')`,
        values: [bot_id],
    });

    return Number(res.payload?.[0]?.open || 0);
}
