import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    /**
     * The bot message the retry runs again: a failure notice carries the
     * job that ended without an answer (`failed_job_id`).
     */
    message_id: number | string;
};

type Row = {
    failed_job_id: number | null;
    last_error: string | null;
};

/**
 * Why the run behind a message ended without sending its answer: its
 * `failed_job_id` and that job's `last_error`. A retry reads it so it
 * doesn't set off on the same wrong premise a second time (the failure
 * notices themselves are app records, left out of the history the run
 * reads).
 */
export default async function grabRetryFailure({ message_id }: Params): Promise<{ job_id: number; reason: string } | null> {
    const res = await BunSQLite.sql<Row>({
        sql: `SELECT m.failed_job_id, q.last_error
              FROM bot_messages m
              LEFT JOIN bots_queue q ON q.id = m.failed_job_id
              WHERE m.id = ?
              LIMIT 1`,
        values: [Number(message_id) || 0],
    });

    const row = res.payload?.[0];
    if (!row?.failed_job_id) return null;

    return {
        job_id: Number(row.failed_job_id),
        reason: String(row.last_error || "").trim(),
    };
}