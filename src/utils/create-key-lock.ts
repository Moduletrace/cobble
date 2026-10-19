type RunParams<T> = {
    key: string | number;
    task: () => Promise<T>;
};

/**
 * An in-process lock per key: tasks with the same key run one at a time in
 * call order, tasks with different keys run side by side. Used so two jobs
 * never drive the same computer at once.
 */
export default function createKeyLock() {
    const tails = new Map<string, Promise<unknown>>();

    async function run<T>({ key, task }: RunParams<T>): Promise<T> {
        const id = String(key);
        const previous = tails.get(id) || Promise.resolve();
        const current = previous.catch(() => {}).then(task);
        const tail = current.catch(() => {});

        tails.set(id, tail);

        try {
            return await current;
        } finally {
            if (tails.get(id) === tail) {
                tails.delete(id);
            }
        }
    }

    /**
     * Whether a task with this key is running or queued, so a caller can
     * say it's waiting before it joins the line.
     */
    function busy({ key }: { key: string | number }) {
        return tails.has(String(key));
    }

    return { run, busy, size: () => tails.size };
}
