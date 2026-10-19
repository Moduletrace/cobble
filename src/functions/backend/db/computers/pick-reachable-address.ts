import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * Caches the pick, e.g. `computer:<id>`.
     */
    key: string;
    /**
     * Base URLs in the order to try, e.g. the hostname, then the IP address.
     */
    candidates: [string, ...string[]];
};

const picked = new Map<string, { base_url: string; at: number }>();

/**
 * The first of `candidates` that answers over HTTP (any status counts),
 * each given `AppData.ComputerReachTimeoutMs`. The pick is reused for
 * `AppData.ComputerAddressCacheMs` while it is still a candidate. When
 * none answers, the first, so the caller's own error names it.
 */
export default async function pickReachableAddress({ key, candidates }: Params) {
    if (candidates.length < 2) return candidates[0];

    const cached = picked.get(key);

    if (
        cached &&
        Date.now() - cached.at < AppData.ComputerAddressCacheMs &&
        candidates.includes(cached.base_url)
    ) {
        return cached.base_url;
    }

    for (const base_url of candidates) {
        const reached = await fetch(base_url, {
            method: "HEAD",
            redirect: "manual",
            signal: AbortSignal.timeout(AppData.ComputerReachTimeoutMs),
        })
            .then(() => true)
            .catch(() => false);

        if (reached) {
            picked.set(key, { base_url, at: Date.now() });
            return base_url;
        }
    }

    picked.delete(key);

    return candidates[0];
}
