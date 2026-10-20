import { AppData } from "@/src/data/app-data";
import type { HarnessOverview } from "@/src/types";

/**
 * Bumped when `HarnessOverview` changes shape, so an older cache is
 * fetched again instead of read.
 */
const CacheVersion = 1;

type Key = {
    bot_id: number;
    workspace_id?: number | null;
};

export type CachedHarnessOverview = {
    v: number;
    /**
     * Unix ms it was fetched.
     */
    at: number;
    harnesses: HarnessOverview[];
};

function cacheKey({ bot_id, workspace_id }: Key) {
    return `${AppData.HarnessOverviewStorageKey}:${bot_id}:${workspace_id || 0}`;
}

/**
 * The models modal's data last fetched for this conversation, from
 * `localStorage`; null when there is none or it can't be read.
 */
export function readHarnessOverviewCache(key: Key): CachedHarnessOverview | null {
    try {
        const cached = JSON.parse(localStorage.getItem(cacheKey(key)) || "null");

        return cached?.v == CacheVersion &&
            Array.isArray(cached.harnesses) &&
            typeof cached.at == "number"
            ? cached
            : null;
    } catch {
        return null;
    }
}

export function writeHarnessOverviewCache({ harnesses, ...key }: Key & { harnesses: HarnessOverview[] }) {
    try {
        localStorage.setItem(cacheKey(key), JSON.stringify({ v: CacheVersion, at: Date.now(), harnesses }));
    } catch {}
}
