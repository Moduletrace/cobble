import BunSQLite from "@moduletrace/bun-sqlite";
import HarnessError from "@/src/harness/harness-error";
import deferIngestJob from "./defer-ingest-job";

type Params = {
    job_id: number;
    error: unknown;
};

/**
 * What a failed ingest job does next:
 * - every embedding model was resting (nothing was tried): it waits for
 *   them, its attempt given back (`deferIngestJob`);
 * - the model refused in a way retrying can't fix (a setting, a provider
 *   the account doesn't allow): it fails for good at once;
 * - anything else: it's retried with the queue's backoff.
 * Returns whether the job was deferred, so the caller logs only failures.
 */
export default async function settleFailedIngestJob({ job_id, error }: Params) {
    if (error instanceof HarnessError && error.resting) {
        await deferIngestJob({ job_id, until: error.retry_at || 0 });
        return { deferred: true };
    }

    const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);

    if (error instanceof HarnessError && !error.retryable) {
        await BunSQLite.sql({
            sql: `UPDATE file_ingest_queue SET status = 'failed', last_error = ?, locked_at = NULL, locked_by = NULL,
                updated_at = ? WHERE id = ? AND status = 'processing'`,
            values: [message, Date.now(), job_id],
        }).catch(() => {});

        return { deferred: false };
    }

    await BunSQLite.queue.fail({ table: "file_ingest_queue", id: job_id, error: message }).catch(() => {});

    return { deferred: false };
}
