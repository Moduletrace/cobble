let wake: (() => void) | undefined;

/**
 * Lets the running ingest worker register how to poll at once, kept apart
 * from the handler so an upload can wake it without bundling it.
 */
export function setFileIngestWaker({ waker }: { waker: () => void }) {
    wake = waker;
}

/**
 * Polls now instead of at the next tick, so a fresh file is readable
 * moments after it lands. Does nothing where the worker doesn't run.
 */
export default function wakeFileIngest() {
    wake?.();
}
