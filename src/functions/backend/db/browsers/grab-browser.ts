import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BROWSERS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseBrowserRow from "./parse-browser-row";

type Params = {
    /**
     * The owner: another user's browser reads as not found.
     */
    user_id: number | string;
    browser_id: number | string;
};

/**
 * One of a user's own browsers. Throws when it isn't theirs.
 */
export default async function grabBrowser({ user_id, browser_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BROWSERS>({
        sql: `SELECT * FROM browsers WHERE id = ? AND user_id = ?`,
        values: [Number(browser_id), Number(user_id)],
    });
    const row = res.payload?.[0];

    if (!row) throw new AppError(`Browser not found.`);

    return { browser: parseBrowserRow({ row }), headers: row.headers || "" };
}
