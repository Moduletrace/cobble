import BunSQLite from "@moduletrace/bun-sqlite";
import grabBrowser from "./grab-browser";

type Params = {
    user_id: number | string;
    browser_id: number | string;
};

/**
 * Deletes one of a user's browsers and every choice that named it, the
 * children explicitly since foreign keys are off outside the server.
 */
export default async function deleteBrowser({ user_id, browser_id }: Params) {
    const { browser } = await grabBrowser({ user_id, browser_id });

    await BunSQLite.sql({ sql: `DELETE FROM browser_access WHERE browser_id = ?`, values: [browser.id] });

    const res = await BunSQLite.sql({ sql: `DELETE FROM browsers WHERE id = ?`, values: [browser.id] });

    if (!res.success) throw new Error(`Couldn't delete the browser: ${res.error}`);

    return browser;
}
