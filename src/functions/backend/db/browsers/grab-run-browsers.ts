import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BROWSER_ACCESS, BUN_SQLITE_COBBLE_BROWSERS } from "@/db/types/db";
import type { BrowserRunKind } from "@/src/dict/browser-dict";
import browserRunAllowed from "@/src/utils/browser-access/browser-run-allowed";
import browserScopeSql from "@/src/utils/browser-access/browser-scope-sql";
import pickDefaultBrowser from "@/src/utils/browser-access/pick-default-browser";

type Params = {
    /**
     * The user the run is for: the only one whose browsers it can get.
     */
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    run_kind: BrowserRunKind;
};

/**
 * The browsers one run gets and which is the default (null: the
 * computer's). Only that user's own, turned on, picked for this place, and
 * allowed for this kind of run (`browserRunAllowed`).
 */
export default async function grabRunBrowsers({ user_id, bot_id, workspace_id, run_kind }: Params) {
    const scope = browserScopeSql({ alias: "ba", user_id, bot_id, workspace_id });
    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BROWSER_ACCESS>({
                sql: `SELECT ba.* FROM browser_access ba WHERE ${scope.sql}`,
                values: scope.values,
            })
        ).payload || [];
    const ids = [...new Set(rows.flatMap((row) => (row.browser_id ? [row.browser_id] : [])))];

    if (!ids.length) return { browsers: [] as BUN_SQLITE_COBBLE_BROWSERS[], default_id: null };

    const found =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BROWSERS>({
                sql: `SELECT * FROM browsers WHERE user_id = ? AND enabled = 1 AND id IN (${ids.map(() => "?").join(", ")})`,
                values: [Number(user_id), ...ids],
            })
        ).payload || [];
    const browsers = found.filter((browser) => browserRunAllowed({ run_kind, allow_routines: browser.allow_routines }));

    return {
        browsers,
        default_id: pickDefaultBrowser({ rows, usable_ids: browsers.map((browser) => Number(browser.id)) }),
    };
}
