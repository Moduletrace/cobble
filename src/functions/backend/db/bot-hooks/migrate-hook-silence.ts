import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Hooks from before `silent` existed run silently from now on: an install
 * that updates shouldn't have its hooks start taking over conversations
 * unasked. New hooks are asked about it when they're made, and the flag is
 * only null until this runs once.
 */
export default async function migrateHookSilence() {
    const res = await BunSQLite.sql({
        sql: `UPDATE bot_hooks SET silent = 1 WHERE silent IS NULL`,
    });

    if (!res.success) {
        throw new Error(`Couldn't set the existing hooks silent: ${res.error}`);
    }
}