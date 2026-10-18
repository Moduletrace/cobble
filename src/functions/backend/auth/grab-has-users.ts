import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_USERS, BunSQLiteTables } from "@/db/types/db";

/**
 * Whether any account exists yet. A fresh install has none, and is
 * sent to `/auth/signup` to create the super admin.
 */
export default async function grabHasUsers() {
    const res = await BunSQLite.select<
        BUN_SQLITE_COBBLE_USERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "users",
        query: {
            limit: 1,
        },
    });

    return Boolean(res?.payload?.[0]?.id);
}
