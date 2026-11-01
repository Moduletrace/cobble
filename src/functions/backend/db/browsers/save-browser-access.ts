import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BROWSER_ACCESS, BunSQLiteTables } from "@/db/types/db";
import type { SaveBrowserAccessRequest } from "@/src/schemas/browser-schema";
import AppError from "@/src/utils/app-error";
import browserAccessRows from "@/src/utils/browser-access/browser-access-rows";
import grabChatBot from "../bots/grab-chat-bot";
import grabUserWorkspace from "../workspaces/grab-user-workspace";
import grabBrowsers from "./grab-browsers";

type Params = {
    /**
     * The session's user: only their own browsers, only places they reach.
     */
    user_id: number | string;
    data: SaveBrowserAccessRequest;
};

/**
 * Replaces one scope's picks for a user (`browserAccessRows`): which of
 * their browsers apply there and which is the default.
 */
export default async function saveBrowserAccess({ user_id, data }: Params) {
    const { bot_id, workspace_id, default_browser, available_ids } = data;

    if (bot_id && workspace_id) throw new AppError(`Pick a bot or a workspace, not both.`);

    if (workspace_id && !(await grabUserWorkspace({ user_id, workspace_id }))) {
        throw new AppError(`Workspace not found.`);
    }

    if (bot_id && !(await grabChatBot({ user_id, bot_id }))) throw new AppError(`Bot not found.`);

    const rows = browserAccessRows({ default_browser, available_ids });
    const own = (await grabBrowsers({ user_id })).map((browser) => browser.id);

    if (rows.some((row) => row.browser_id && !own.includes(row.browser_id))) {
        throw new AppError(`Browser not found.`);
    }

    const cleared = await BunSQLite.sql({
        sql: `DELETE FROM browser_access WHERE user_id = ? AND bot_id IS ? AND workspace_id IS ?`,
        values: [Number(user_id), bot_id || null, workspace_id || null],
    });

    if (!cleared.success) throw new Error(`Couldn't save the browsers: ${cleared.error}`);

    if (!rows.length) return;

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BROWSER_ACCESS, (typeof BunSQLiteTables)[number]>({
        table: "browser_access",
        data: rows.map((row) => ({
            ...row,
            browser_id: row.browser_id ?? undefined,
            user_id: Number(user_id),
            bot_id: bot_id || undefined,
            workspace_id: workspace_id || undefined,
        })),
    });

    if (!res.success) throw new Error(`Couldn't save the browsers: ${res.msg}`);
}
