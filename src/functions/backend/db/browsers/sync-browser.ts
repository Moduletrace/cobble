import BunSQLite from "@moduletrace/bun-sqlite";
import { decrypt } from "@/src/utils/crypt";
import parseJsonColumn from "../extensions/parse-json-column";
import grabBrowser from "./grab-browser";
import listBrowserTools from "./list-browser-tools";
import recordBrowserConnection from "./record-browser-connection";

type Params = {
    user_id: number | string;
    browser_id: number | string;
};

/**
 * Lists a browser's tools now and saves them. Being offline is normal for
 * a browser on a laptop, so it's recorded, not thrown, and the last listing
 * stays. There's no cron for this: nothing should call a sleeping laptop
 * every hour to mark it broken.
 */
export default async function syncBrowser({ user_id, browser_id }: Params) {
    const { browser, headers } = await grabBrowser({ user_id, browser_id });

    try {
        const tools = await listBrowserTools({
            url: browser.url,
            headers: parseJsonColumn<Record<string, string>>({
                text: headers ? await decrypt(headers) : "",
                fallback: {},
            }),
        });

        await BunSQLite.sql({
            sql: `UPDATE browsers SET tools_cache = ? WHERE id = ?`,
            values: [JSON.stringify(tools), browser.id],
        });
        await recordBrowserConnection({ browser_id: browser.id });
    } catch (error: unknown) {
        await recordBrowserConnection({
            browser_id: browser.id,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}
