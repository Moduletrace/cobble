type RateLimitEntry = {
    count: number;
    reset_at: number;
};

const store = new Map<string, RateLimitEntry>();

type Params = {
    /**
     * Unique bucket key, e.g. `sso-login:<user_id>` or `contact:<ip>`
     */
    key: string;
    /**
     * Max hits allowed inside the window
     */
    limit: number;
    window_ms: number;
};

export type RateLimitReturn = {
    allowed: boolean;
    remaining: number;
    reset_at: number;
};

/**
 * In-memory fixed-window rate limiter. Each call counts as one hit.
 * State is per-process, which is enough for single-container deploys.
 */
export default function rateLimit({
    key,
    limit,
    window_ms,
}: Params): RateLimitReturn {
    const now = Date.now();

    if (store.size > 10000) {
        for (const [k, entry] of store) {
            if (entry.reset_at <= now) store.delete(k);
        }
    }

    const existing = store.get(key);

    const entry: RateLimitEntry =
        existing && existing.reset_at > now
            ? existing
            : { count: 0, reset_at: now + window_ms };

    entry.count += 1;
    store.set(key, entry);

    return {
        allowed: entry.count <= limit,
        remaining: Math.max(0, limit - entry.count),
        reset_at: entry.reset_at,
    };
}

/**
 * Clear a bucket, e.g. after a successful login.
 */
export function resetRateLimit({ key }: { key: string }) {
    store.delete(key);
}
