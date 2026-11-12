import pruneComputerCaches from "@/src/functions/backend/computers/prune-computer-caches";

/**
 * Clears the caches a computer's folders hold (`pruneComputerCaches`):
 * what pip, npm and bun write beside a run's work, Python's bytecode and
 * every Chrome profile's caches. Runs now keep their caches inside the
 * container (`computerCacheEnv`), so this is what an install that grew
 * before that shrinks back with.
 */
export default async function cronPruneComputerCaches() {
    const pruned = await pruneComputerCaches();
    const bytes = pruned.reduce((total, entry) => total + entry.bytes, 0);

    return { removed: pruned.length, mb: Math.round(bytes / (1024 * 1024)) };
}