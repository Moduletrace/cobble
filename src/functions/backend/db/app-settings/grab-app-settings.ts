import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_APP_SETTINGS } from "@/db/types/db";

let cache: Map<string, string> | null = null;

/**
 * Every install-wide setting, cached per process (like `grabAllEnvs`).
 * `saveAppSetting` and `deleteAppSetting` clear it.
 */
export default async function grabAppSettings() {
    if (cache) return cache;

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_APP_SETTINGS>({
        sql: `SELECT key, value FROM app_settings`,
        values: [],
    });

    const map = new Map<string, string>();

    for (const row of res.payload || []) {
        if (row.key) map.set(row.key, row.value || "");
    }

    cache = map;

    return map;
}

/**
 * Drops the cache, so the next read sees the database.
 */
export function clearAppSettingsCache() {
    cache = null;
}
