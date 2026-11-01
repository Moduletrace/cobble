import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BROWSERS } from "@/db/types/db";
import parseBrowserRow from "./parse-browser-row";

type Params = {
    user_id: number | string;
};

/**
 * A user's own browsers, for their settings. Never another user's.
 */
export default async function grabBrowsers({ user_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BROWSERS>({
        sql: `SELECT * FROM browsers WHERE user_id = ? ORDER BY id ASC`,
        values: [Number(user_id)],
    });

    return (res.payload || []).map((row) => parseBrowserRow({ row }));
}
