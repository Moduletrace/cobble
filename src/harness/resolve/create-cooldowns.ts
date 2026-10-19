/**
 * Keys (candidates or providers) that shouldn't be tried until a time.
 * In memory, per process: a restart forgets them, which only costs one
 * failed call each.
 */
export default function createCooldowns() {
    const until = new Map<string, number>();

    return {
        set({ key, at }: { key: string; at: number }) {
            until.set(key, Math.max(at, until.get(key) || 0));
        },
        /**
         * When the key can be tried again, or undefined if it can now.
         */
        get({ key, now = Date.now() }: { key: string; now?: number }) {
            const at = until.get(key);

            if (at === undefined) return undefined;

            if (at <= now) {
                until.delete(key);
                return undefined;
            }

            return at;
        },
        clear() {
            until.clear();
        },
    };
}

export type HarnessCooldowns = ReturnType<typeof createCooldowns>;
