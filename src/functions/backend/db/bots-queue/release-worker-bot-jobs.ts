import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    worker: string;
};

/**
 * Puts the jobs a handler was running back in the queue straight away,
 * instead of waiting out the lock timeout. For startup, after a restart
 * cut those jobs off. The cut-off attempt isn't counted.
 */
export default async function releaseWorkerBotJobs({ worker }: Params) {
    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `UPDATE bots_queue SET status = 'pending', attempts = MAX(attempts - 1, 0), available_at = ?, locked_at = NULL, locked_by = NULL, updated_at = ? WHERE status = 'processing' AND locked_by = ? RETURNING id`,
        values: [now, now, worker],
    });

    return res.payload?.length || 0;
}
