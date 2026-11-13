import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    job_id: number;
    message_id: number;
};

/**
 * Ties a run's trace to the message it ended in, so its Details modal can
 * show what the run did under its debug logs tab. Best effort: a run that
 * kept no trace, or one whose entries the prune already took, has nothing
 * to update and isn't an error.
 */
export default async function attachJobTracesToMessage({ job_id, message_id }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE bot_job_traces SET message_id = ? WHERE bots_queue_id = ? AND message_id IS NULL`,
        values: [message_id, job_id],
    }).catch(() => {});
}