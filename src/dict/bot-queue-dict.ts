/**
 * `last_error` of a job the user cancelled. Cancelled jobs are `failed`
 * (bun-sqlite queues have no cancelled status) with this error.
 */
export const BotJobCancelledError = "Cancelled";

/**
 * `last_error` bun-sqlite sets when it releases a job whose handler went
 * silent past the lock timeout on its last attempt.
 */
export const BotJobLockTimedOutError = "Lock timed out";
