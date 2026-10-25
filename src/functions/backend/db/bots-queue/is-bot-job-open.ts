import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Whether a job is still queued or working.
 */
export default async function isBotJobOpen({ job_id }: { job_id: number | string }) {
    const res = await BunSQLite.sql({
        sql: `SELECT id FROM bots_queue WHERE id = ? AND status IN ('pending', 'processing') LIMIT 1`,
        values: [job_id],
    });

    return Boolean(res.payload?.[0]);
}
