import { grabHarnessUsageScope, runWithHarnessUsageScope } from "./harness-usage-scope";
import type { HarnessUsageScope } from "./types";

type Params<T> = {
    /**
     * What to attribute the work to when nothing already owns it: a file
     * ingested by the queue has no run behind it, but its owner must still
     * see what the embedding cost. Null when there is nobody to charge.
     */
    scope: HarnessUsageScope | null;
    task: () => Promise<T>;
    /**
     * How the work is attributed: `enclosing` keeps whatever run it is in,
     * `own` always reports under `scope` (the session namer, whose job is
     * already complete and must not be charged to it).
     */
    mode?: "enclosing" | "own";
};

/**
 * Runs work under an attribution the run may not have. Nothing is entered
 * when a run is already in charge, so an ingest a bot asked for is charged
 * to that bot's user and not to the file's owner.
 */
export default async function runWithFallbackScope<T>({
    scope,
    task,
    mode = "enclosing",
}: Params<T>): Promise<T> {
    if (mode == "enclosing" && grabHarnessUsageScope()?.user_id) {
        return await task();
    }

    const user_id = Number(scope?.user_id);

    if (!Number.isFinite(user_id) || user_id <= 0 || user_id === null) {
        return await task();
    }

    return await runWithHarnessUsageScope({ scope: { ...scope, user_id }, task });
}
