import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The handler's family (`AppData.BotQueueWorker`), not its own id: the id
     * carries the process's pid, so a restart releases what the previous
     * process of this install was running.
     */
    family: string;
};

/**
 * Puts the jobs a handler was running back in the queue straight away,
 * instead of waiting out the lock timeout. For startup, after a restart
 * cut those jobs off. The cut-off attempt isn't counted.
 */
export default async function releaseWorkerBotJobs({ family }: Params) {
    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `UPDATE bots_queue SET status = 'pending', attempts = MAX(attempts - 1, 0), available_at = ?, locked_at = NULL, locked_by = NULL, updated_at = ? WHERE status = 'processing' AND (locked_by = ? OR locked_by LIKE ?) RETURNING id`,
        values: [now, now, family, `${family}-%`],
    });

    return res.payload?.length || 0;
}
