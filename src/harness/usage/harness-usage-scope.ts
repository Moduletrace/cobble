import { AsyncLocalStorage } from "node:async_hooks";
import type { HarnessUsageScope } from "./types";

/**
 * The attribution a run's model calls carry.
 *
 * A bot's run is entered once (`runWithHarnessUsageScope`) and everything
 * it calls underneath - the text loop's turns, a session summary, a
 * transcription, an image, an embedding - is written down for that user,
 * bot, session and job without threading the ids through every harness
 * function. One of those calls is itself entered by a `run` that has to
 * swap the scope it reports under (`withHarnessUsageScope`): the session
 * namer runs outside the job's scope, on purpose, since the job it named
 * is already complete.
 *
 * The store is merged, not replaced: a call that only knows the message id
 * (the text loop attaching a turn's usage) keeps the run's user, bot and
 * job.
 */
const storage = new AsyncLocalStorage<HarnessUsageScope>();

/**
 * Runs `task` with `scope` as its attribution. Ambient values are merged
 * under it, so a nested call keeps what the outer one set and overrides
 * only what it knows better (null clears a field).
 */
export async function runWithHarnessUsageScope<T>(
    { scope, task }: { scope: HarnessUsageScope; task: () => Promise<T> },
): Promise<T> {
    return await storage.run(mergeScopes({ base: storage.getStore(), overlay: scope }), task);
}

/**
 * The attribution a call right now carries, if any.
 */
export function grabHarnessUsageScope(): HarnessUsageScope | undefined {
    return storage.getStore();
}

function mergeScopes({
    base,
    overlay,
}: {
    base?: HarnessUsageScope;
    overlay: HarnessUsageScope;
}): HarnessUsageScope {
    const merged: HarnessUsageScope = { ...base };

    for (const [key, value] of Object.entries(overlay) as [
        keyof HarnessUsageScope,
        HarnessUsageScope[keyof HarnessUsageScope],
    ][]) {
        if (value === undefined) continue;

        /**
         * A null is a real value here: it says "none", e.g. a bot's own
         * chat has no workspace, and must clear what the outer scope had.
         */
        (merged as Record<string, unknown>)[key] = value;
    }

    return merged;
}
