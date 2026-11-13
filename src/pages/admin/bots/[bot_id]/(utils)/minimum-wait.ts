/**
 * Waits for `task` and for at least `minimum_ms`, whichever ends last, and
 * never throws: it is used to keep a spinner up long enough to be seen, not
 * to report what the work did (the work reports itself).
 */
export default async function minimumWait({
    task,
    minimum_ms,
}: {
    task: Promise<unknown>;
    minimum_ms: number;
}) {
    const settled = task.then(
        () => undefined,
        () => undefined,
    );
    const waited = new Promise<void>((resolve) => setTimeout(resolve, minimum_ms));

    await Promise.all([settled, waited]);
}