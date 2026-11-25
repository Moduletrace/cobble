/**
 * The abort controllers of the jobs this process is running right now,
 * keyed by job id. Stopping a bot from the chat aborts the request its job
 * is waiting on (a model that never answers, a tool that hangs) instead of
 * leaving it to find out on its next heartbeat, which can take minutes.
 *
 * Only the process running a job can abort it, so this is a bonus: a job
 * that stops has already been asked to, and a handler in another process
 * learns that on its next `updateBotJob`. Kept free of imports so the API
 * routes can use it without pulling the queue handler into a page bundle.
 */
type Entry = {
    abort: () => void;
    /**
     * Stops the run where it is and leaves it one turn to say what it did
     * (`StoppedRunNote`), instead of dropping its work.
     */
    stop_summary?: () => void;
};

const running = new Map<number, Entry>();

/**
 * Called by a handler once it holds a job, with the way to abort it and to
 * let it summarize what it did first.
 */
export function registerJobAbort({
    job_id,
    abort,
    stop_summary,
}: {
    job_id: number | string;
    abort: () => void;
    stop_summary?: () => void;
}) {
    running.set(Number(job_id), { abort, stop_summary });
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
    const abort = running.get(Number(job_id))?.abort;

    if (!abort) return false;

    abort();

    return true;
}

/**
 * Asks a job running here to stop at its next step and write what it did so
 * far. False means it runs in another process, or not at all: the plain
 * stopped message is what the user gets then.
 */
export function requestJobStopSummary({ job_id }: { job_id: number | string }) {
    const stop_summary = running.get(Number(job_id))?.stop_summary;

    if (!stop_summary) return false;

    stop_summary();

    return true;
}
