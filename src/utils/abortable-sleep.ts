type Params = {
    ms: number;
    signal?: AbortSignal;
};

/**
 * Waits `ms`, or rejects with the signal's reason as soon as it aborts, so
 * a long wait (a video job being checked on) never outlives a Stop.
 */
export default function abortableSleep({ ms, signal }: Params) {
    return new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(signal.reason);

        const onAbort = () => {
            clearTimeout(timer);
            reject(signal?.reason);
        };
        const timer = setTimeout(() => {
            signal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);

        signal?.addEventListener("abort", onAbort, { once: true });
    });
}
