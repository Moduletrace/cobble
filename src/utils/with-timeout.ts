import TaskTimeoutError from "./task-timeout-error";

type Params<T> = {
    /**
     * The work. It gets a signal that aborts when the deadline passes or
     * the caller cancels, so its requests stop too.
     */
    task: (signal: AbortSignal) => Promise<T>;
    timeout_ms: number;
    /**
     * The caller's own cancellation, e.g. a job that lost its lock.
     */
    signal?: AbortSignal;
    /**
     * Shown when the deadline passes.
     */
    message?: string;
    /**
     * Called once the deadline passes, before the task is stopped. Use it
     * to tell a deadline apart from the caller's own cancellation.
     */
    on_timeout?: () => void;
};

/**
 * Runs a task with a deadline, resolving or rejecting with whatever the
 * task does. When the deadline passes (or the caller's signal aborts) the
 * task's signal is aborted and the wait ends at once, even if the task
 * never settles, so a hung call can't hold a queue slot or a lock forever.
 * Late results and errors from the task are dropped.
 */
export default function withTimeout<T>({
    task,
    timeout_ms,
    signal,
    message = "The task took too long.",
    on_timeout,
}: Params<T>): Promise<T> {
    if (signal?.aborted) {
        return Promise.reject(reasonOf({ signal }));
    }

    const controller = new AbortController();
    const parent = signal;
    const on_abort = () => controller.abort(reasonOf({ signal: parent! }));

    parent?.addEventListener("abort", on_abort, { once: true });

    const timer = setTimeout(() => {
        on_timeout?.();
        controller.abort(new TaskTimeoutError({ message }));
    }, timeout_ms);

    const done = new Promise<T>((resolve, reject) => {
        controller.signal.addEventListener(
            "abort",
            () => reject(controller.signal.reason),
            { once: true },
        );

        /**
         * `Promise.resolve().then` turns a synchronous throw from the task
         * into a rejection instead of escaping the executor. A task
         * cancelled before it starts is never started.
         */
        Promise.resolve()
            .then(() => {
                if (controller.signal.aborted) {
                    throw reasonOf({ signal: controller.signal });
                }

                return task(controller.signal);
            })
            .then(resolve, reject);
    });

    return done.finally(() => {
        clearTimeout(timer);
        parent?.removeEventListener("abort", on_abort);
    });
}

function reasonOf({ signal }: { signal: AbortSignal }) {
    return signal.reason instanceof Error ? signal.reason : new Error("Cancelled.");
}
