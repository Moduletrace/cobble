/**
 * A per-process cache slot that survives module duplication.
 *
 * bunext bundles pages and API routes separately, so a module-scoped `let`
 * cache exists once per bundle: a save that clears its own copy leaves the
 * other one serving stale data until the process restarts (a saved API key
 * never reached the model list). The key is taken from the global symbol
 * registry, which resolves to the same symbol in every bundle, and the value
 * is stored on `globalThis`, so every copy reads and clears one slot.
 */
type Slot<Value> = {
    get(): Value | undefined;
    set(value: Value): void;
    clear(): void;
};

/**
 * Named caches, so two modules never share a slot by accident.
 */
export type GlobalCacheName =
    | "cobble.grabAllEnvs.cache"
    | "cobble.grabAppSettings.cache";

export default function globalCache<Value>({
    name,
}: {
    name: GlobalCacheName;
}): Slot<Value> {
    const key = Symbol.for(name);
    const holder = globalThis as Record<symbol, Value | undefined>;

    return {
        get: () => holder[key],
        set: (value: Value) => {
            holder[key] = value;
        },
        clear: () => {
            delete holder[key];
        },
    };
}
