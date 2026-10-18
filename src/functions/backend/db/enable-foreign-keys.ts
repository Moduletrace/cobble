import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * SQLite leaves foreign keys off per connection, so the schema's
 * `ON DELETE CASCADE` rules never fire unless this runs first. bun-sqlite
 * reuses one connection per process, so once at startup is enough.
 */
export default async function enableForeignKeys() {
    const res = await BunSQLite.sql({ sql: `PRAGMA foreign_keys = ON` });

    if (!res.success) {
        throw new Error(`Couldn't enable foreign keys: ${res.msg}`);
    }
}
