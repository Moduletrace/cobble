import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    browser_id: number;
    /**
     * Left out when it connected.
     */
    error?: string;
};

/**
 * Saves whether a run could reach a browser, so its settings row shows one
 * that went offline (or came back). Never throws.
 */
export default async function recordBrowserConnection({ browser_id, error }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE browsers SET status = ?, last_error = ?, last_synced_at = ? WHERE id = ?`,
        values: [error ? "error" : "ok", (error || "").slice(0, 4000), Date.now(), browser_id],
    }).catch(() => {});
}
