import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    mcp_server_id: number;
    /**
     * Left out when it connected.
     */
    error?: string;
};

/**
 * Saves whether a bot's run could connect to an MCP server, so its row in
 * Settings, under MCPs, shows a server that stopped answering (or came
 * back). Its tools listing is left as it was. Never throws.
 */
export default async function recordMcpServerConnection({ mcp_server_id, error }: Params) {
    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE mcp_servers SET status = ?, last_error = ?, last_synced_at = ?, updated_at = ? WHERE id = ?`,
        values: [error ? "error" : "ok", (error || "").slice(0, 4000), now, now, mcp_server_id],
    }).catch(() => {});
}
