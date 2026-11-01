import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BROWSERS, BunSQLiteTables } from "@/db/types/db";
import { BrowserDefaultExcludedTools } from "@/src/dict/browser-dict";
import type { SaveBrowserRequest } from "@/src/schemas/browser-schema";
import { encrypt } from "@/src/utils/crypt";
import mcpServerSlug from "@/src/utils/mcp-server-slug";
import grabBrowser from "./grab-browser";
import syncBrowser from "./sync-browser";
import assertBrowserUrl from "./assert-browser-url";

type Params = {
    /**
     * The session's user, who owns it.
     */
    user_id: number | string;
    data: SaveBrowserRequest;
};

/**
 * Adds or edits one of a user's browsers, then connects and lists its
 * tools (a browser that's offline right now still saves). A new one starts
 * without the tools in `BrowserDefaultExcludedTools`, and gives no bot
 * anything until `saveBrowserAccess`. Blank headers on an edit keep the
 * saved ones, which are never sent back to the page.
 */
export default async function saveBrowser({ user_id, data }: Params) {
    await assertBrowserUrl({ url: data.url });

    const headers = Object.keys(data.headers).length ? await encrypt(JSON.stringify(data.headers)) : null;
    const fields = {
        name: data.name,
        description: data.description,
        url: data.url,
        enabled: data.enabled ? 1 : 0,
        allow_routines: data.allow_routines ? 1 : 0,
    } as const;

    if (data.browser_id) {
        const { browser } = await grabBrowser({ user_id, browser_id: data.browser_id });
        const res = await BunSQLite.update<BUN_SQLITE_COBBLE_BROWSERS, (typeof BunSQLiteTables)[number]>({
            table: "browsers",
            targetId: browser.id,
            data: {
                ...fields,
                excluded_tools: JSON.stringify(data.excluded_tools ?? browser.excluded_tools),
                ...(headers || data.clear_headers ? { headers: headers || "" } : {}),
            },
        });

        if (!res.success) throw new Error(`Couldn't save the browser: ${res.msg}`);

        await syncBrowser({ user_id, browser_id: browser.id });

        return browser.id;
    }

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BROWSERS, (typeof BunSQLiteTables)[number]>({
        table: "browsers",
        data: [
            {
                ...fields,
                user_id: Number(user_id),
                slug: await uniqueSlug({ user_id, name: data.name }),
                headers: headers || "",
                excluded_tools: JSON.stringify(data.excluded_tools ?? BrowserDefaultExcludedTools),
                tools_cache: "[]",
                status: "untested",
            },
        ],
    });

    const id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !id) throw new Error(`Couldn't add the browser: ${res.msg}`);

    await syncBrowser({ user_id, browser_id: Number(id) });

    return Number(id);
}

async function uniqueSlug({ user_id, name }: { user_id: number | string; name: string }) {
    const base = mcpServerSlug({ name });
    const taken = new Set(
        (
            await BunSQLite.sql<{ slug: string }>({
                sql: `SELECT slug FROM browsers WHERE user_id = ?`,
                values: [Number(user_id)],
            })
        ).payload?.map((row) => row.slug),
    );

    if (!taken.has(base)) return base;

    for (let n = 2; ; n++) {
        if (!taken.has(`${base}_${n}`)) return `${base}_${n}`;
    }
}
