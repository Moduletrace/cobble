let wake: (() => void) | undefined;

/**
 * Lets the running queue handler register how to poll at once. Kept apart
 * from the handler so API routes can wake it without bundling it.
 */
export function setBotsQueueWaker({ waker }: { waker: () => void }) {
    wake = waker;
}

/**
 * Polls now instead of at the next tick, so a chat reply starts at once.
 * Does nothing where the queue doesn't run (the next poll on the main
 * server picks the job up).
 */
export default function wakeBotsQueue() {
    wake?.();
}
