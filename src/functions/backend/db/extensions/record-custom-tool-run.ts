import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    custom_tool_id: number;
    /**
     * Left out when it worked.
     */
    error?: string;
};

/**
 * Saves how a custom tool's run went (`status`, `last_error`,
 * `last_checked_at`), for its row in Settings, under Tools. Never throws:
 * a run doesn't fail over its bookkeeping.
 */
export default async function recordCustomToolRun({ custom_tool_id, error }: Params) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE custom_tools SET status = ?, last_error = ?, last_checked_at = ?, updated_at = ? WHERE id = ?`,
        values: [error ? "error" : "ok", (error || "").slice(0, 4000), now, now, custom_tool_id],
    }).catch(() => {});
}
