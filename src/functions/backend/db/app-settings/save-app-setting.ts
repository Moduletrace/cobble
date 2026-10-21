import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_APP_SETTINGS, BunSQLiteTables } from "@/db/types/db";
import { clearAppSettingsCache } from "./grab-app-settings";

type Params = {
    key: string;
    /**
     * Null or empty removes it, so the code's default applies again.
     */
    value?: string | null;
};

/**
 * Saves (or removes) one install-wide setting and clears the cache, so the
 * next read sees it.
 */
export default async function saveAppSetting({ key, value }: Params) {
    const existing = await BunSQLite.sql<BUN_SQLITE_COBBLE_APP_SETTINGS>({
        sql: `SELECT id FROM app_settings WHERE key = ? LIMIT 1`,
        values: [key],
    }).then((res) => res.payload?.[0]);

    if (!value) {
        await BunSQLite.sql({
            sql: `DELETE FROM app_settings WHERE key = ?`,
            values: [key],
        });
        clearAppSettingsCache();
        return null;
    }

    if (existing?.id) {
        await BunSQLite.sql({
            sql: `UPDATE app_settings SET value = ?, updated_at = ? WHERE id = ?`,
            values: [value, Date.now(), existing.id],
        });
    } else {
        await BunSQLite.insert<BUN_SQLITE_COBBLE_APP_SETTINGS, (typeof BunSQLiteTables)[number]>({
            table: "app_settings",
            data: [{ key, value }],
        });
    }

    clearAppSettingsCache();

    return value;
}
