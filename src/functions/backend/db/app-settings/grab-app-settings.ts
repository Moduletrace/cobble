import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_APP_SETTINGS } from "@/db/types/db";
import globalCache from "@/src/utils/global-cache";

/**
 * The cache lives on `globalThis`, behind a registered symbol, rather than
 * in a module variable: the page and API bundles each carry their own copy
 * of this module, so a module-scoped cache would let a save clear its own
 * copy while another page kept serving a stale one until the next restart.
 */
const cache = globalCache<Map<string, string>>({
    name: "cobble.grabAppSettings.cache",
});

/**
 * Every install-wide setting, cached per process (like `grabAllEnvs`).
 * `saveAppSetting` and `deleteAppSetting` clear it.
 */
export default async function grabAppSettings() {
    const cached = cache.get();

    if (cached) return cached;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_APP_SETTINGS>({
        sql: `SELECT key, value FROM app_settings`,
        values: [],
    });

    const map = new Map<string, string>();

    for (const row of res.payload || []) {
        if (row.key) map.set(row.key, row.value || "");
    }

    cache.set(map);

    return map;
}

/**
 * Drops the cache, so the next read sees the database.
 */
export function clearAppSettingsCache() {
    cache.clear();
}
