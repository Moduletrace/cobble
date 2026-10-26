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
 * a run doesn't fail over its bookkeeping. `updated_at` is left alone: it
 * says when the tool's settings last changed.
 */
export default async function recordCustomToolRun({ custom_tool_id, error }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE custom_tools SET status = ?, last_error = ?, last_checked_at = ? WHERE id = ?`,
        values: [error ? "error" : "ok", (error || "").slice(0, 4000), Date.now(), custom_tool_id],
    }).catch(() => {});
}
