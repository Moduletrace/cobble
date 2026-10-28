import { AppData } from "@/src/data/app-data";
import type {
    BotHarnessSettingsPayload,
    HarnessCatalogPayload,
} from "@/src/types";

/**
 * Bumped when a cached model payload changes shape, so an older cache is
 * fetched again instead of read.
 */
const CacheVersion = 2;

type CacheEnvelope<T> = {
    v: number;
    /**
     * Unix ms it was fetched.
     */
    at: number;
    data: T;
};

type UserKey = {
    user_id: number | string;
};

type SettingsKey = UserKey & {
    bot_id: number | string;
    workspace_id?: number | null;
};

function catalogKey({ user_id }: UserKey) {
    return `${AppData.HarnessCacheStorageKey}:catalog:${user_id}`;
}

function settingsKey({ user_id, bot_id, workspace_id }: SettingsKey) {
    return `${AppData.HarnessCacheStorageKey}:settings:${user_id}:${bot_id}:${workspace_id || 0}`;
}

function read<T>(key: string): CacheEnvelope<T> | null {
    try {
        const cached = JSON.parse(localStorage.getItem(key) || "null");

        return cached?.v == CacheVersion &&
            typeof cached.at == "number" &&
            Array.isArray(cached.data?.harnesses)
            ? cached
            : null;
    } catch {
        return null;
    }
}

function write<T>(key: string, data: T) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify({ v: CacheVersion, at: Date.now(), data } satisfies CacheEnvelope<T>),
        );
    } catch {}
}

/**
 * The install-wide model catalog this user last fetched, from
 * `localStorage`; null when there is none or it can't be read.
 */
export function readHarnessCatalogCache(key: UserKey) {
    return read<HarnessCatalogPayload>(catalogKey(key));
}

export function writeHarnessCatalogCache({
    user_id,
    data,
}: UserKey & { data: HarnessCatalogPayload }) {
    write(catalogKey({ user_id }), data);
}

/**
 * One conversation's model setting this user last fetched, from
 * `localStorage`; null when there is none or it can't be read.
 */
export function readHarnessSettingsCache(key: SettingsKey) {
    return read<BotHarnessSettingsPayload>(settingsKey(key));
}

export function writeHarnessSettingsCache({
    user_id,
    bot_id,
    workspace_id,
    data,
}: SettingsKey & { data: BotHarnessSettingsPayload }) {
    write(settingsKey({ user_id, bot_id, workspace_id }), data);
}

/**
 * Drops every model cache, including the per-conversation keys an older
 * version wrote. Called on logout and after model settings change
 * elsewhere, so the modal can't show a stale pick.
 */
export function clearHarnessCache() {
    const prefixes = [
        AppData.HarnessCacheStorageKey,
        AppData.LegacyHarnessOverviewStorageKey,
    ];

    try {
        const keys: string[] = [];

        for (let index = 0; index < localStorage.length; index++) {
            const key = localStorage.key(index);

            if (key) keys.push(key);
        }

        for (const key of keys) {
            if (prefixes.some((prefix) => key.startsWith(prefix))) {
                localStorage.removeItem(key);
            }
        }
    } catch {}
}
