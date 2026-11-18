/**
 * Wakes the pending jobs a model rest parked ahead of time.
 *
 * `deferBotJob` pushes `available_at` up to a day out when every model is
 * resting with no end, and `claimBotJobs` only claims what is already
 * available. Nothing else would ever move it: the benches live in memory, so
 * a restart forgets them, and a run-limits save clears them, while the job
 * they parked kept sleeping. `last_error IS NULL` keeps a real failure
 * backoff out of it: a job deferred for a rest has never failed a turn.
 */
export const ReleaseRestingBotJobsSql = `UPDATE bots_queue SET available_at = ?, updated_at = ?
    WHERE status = 'pending' AND last_error IS NULL AND available_at > ?
    RETURNING id`;