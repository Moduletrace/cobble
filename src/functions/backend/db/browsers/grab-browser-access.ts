import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BROWSER_ACCESS } from "@/db/types/db";
import { BrowserComputerDefault, BrowserInheritDefault } from "@/src/dict/browser-dict";
import type { BrowserAccessPayload } from "@/src/types";
import grabBrowsers from "./grab-browsers";

type Params = {
    user_id: number | string;
    /**
     * Neither: the user's all-bots scope.
     */
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

/**
 * One scope's picks for a user, with their browsers, for the picker.
 */
export default async function grabBrowserAccess({ user_id, bot_id, workspace_id }: Params): Promise<BrowserAccessPayload> {
    const browsers = await grabBrowsers({ user_id });
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BROWSER_ACCESS>({
        sql: `SELECT * FROM browser_access WHERE user_id = ? AND bot_id IS ? AND workspace_id IS ?`,
        values: [Number(user_id), workspace_id ? null : bot_id ? Number(bot_id) : null, workspace_id ? Number(workspace_id) : null],
    });
    const rows = res.payload || [];
    const chosen = rows.find((row) => row.is_default);

    return {
        browsers: browsers.map(({ id, name, enabled, status }) => ({ id, name, enabled, status })),
        available_ids: rows.flatMap((row) => (row.browser_id ? [row.browser_id] : [])),
        default_browser: chosen ? chosen.browser_id || BrowserComputerDefault : BrowserInheritDefault,
    };
}
