import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    job_id: number | string;
    worker: string;
    /**
     * Latest progress note (markdown), e.g. "Installed deps, running tests".
     */
    progress?: string;
    /**
     * Whatever the bot needs to resume if the job is picked up again.
     */
    checkpoint?: Record<string, unknown>;
};

/**
 * The bot's "still working" update while it processes a job. Renews the
 * lock (so the job isn't presumed lost) and saves progress and a
 * checkpoint. Call it more often than `AppData.BotQueueLockTimeoutMs`.
 *
 * Returns false if this handler no longer holds the job: stop working on
 * it, since it has gone back to the queue.
 */
export default async function updateBotJob({
    job_id,
    worker,
    progress,
    checkpoint,
}: Params) {
    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `UPDATE bots_queue SET locked_at = ?, updated_at = ?, progress = COALESCE(?, progress), checkpoint = COALESCE(?, checkpoint) WHERE id = ? AND status = 'processing' AND locked_by = ? RETURNING id`,
        values: [
            now,
            now,
            progress ?? null,
            checkpoint ? JSON.stringify(checkpoint) : null,
            job_id,
            worker,
        ],
    });

    return Boolean(res.payload?.[0]);
}
