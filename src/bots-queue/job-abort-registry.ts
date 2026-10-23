/**
 * The abort controllers of the jobs this process is running right now,
 * keyed by job id. Stopping a bot from the chat aborts the request its job
 * is waiting on (a model that never answers, a tool that hangs) instead of
 * leaving it to find out on its next heartbeat, which can take minutes.
 *
 * Only the process running a job can abort it, so this is a bonus: the job
 * is already failed in `bots_queue`, and a handler in another process
 * learns that on its next `updateBotJob`. Kept free of imports so the API
 * routes can use it without pulling the queue handler into a page bundle.
 */
const running = new Map<number, () => void>();

/**
 * Called by a handler once it holds a job, with the way to abort it.
 */
export function registerJobAbort({ job_id, abort }: { job_id: number | string; abort: () => void }) {
    running.set(Number(job_id), abort);
}

/**
 * Called by a handler in its `finally`, whatever the outcome.
 */
export function unregisterJobAbort({ job_id }: { job_id: number | string }) {
    running.delete(Number(job_id));
}

/**
 * Aborts a job running here. False means another process (or nobody) has
 * it, so the row's new status is how it finds out.
 */
export function abortRunningJob({ job_id }: { job_id: number | string }) {
    const abort = running.get(Number(job_id));

    if (!abort) return false;

    abort();

    return true;
}
