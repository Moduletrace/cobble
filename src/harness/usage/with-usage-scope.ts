import { runWithHarnessUsageScope } from "./harness-usage-scope";
import type { HarnessUsageScope } from "./types";

/**
 * Runs one call the app makes on a user's behalf inside the scope its
 * usage is written down with (transcribing a dictation, speaking a
 * message, previewing a voice). The bot's run is already inside a scope of
 * its own, so this only adds what the run didn't know: no job, no message,
 * and the session the call belongs to.
 */
export default async function withUsageScope<T>({
    scope,
    task,
}: {
    scope: HarnessUsageScope;
    task: () => Promise<T>;
}): Promise<T> {
    return await runWithHarnessUsageScope({ scope, task });
}
