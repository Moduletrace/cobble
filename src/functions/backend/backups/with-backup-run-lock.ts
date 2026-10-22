let is_running = false;

type Params<T> = {
    task: () => Promise<T>;
};

/**
 * Runs one backup or restore at a time, whichever kind it is, so a
 * database snapshot, a database restore and a whole-data archive never
 * overlap and never fight over the same files. Hands back what the task
 * returned.
 */
export default async function withBackupRunLock<T>({ task }: Params<T>) {
    if (is_running) {
        throw new Error(`Another backup or restore is already running`);
    }

    is_running = true;

    try {
        return await task();
    } finally {
        is_running = false;
    }
}
