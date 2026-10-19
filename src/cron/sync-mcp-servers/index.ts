import BunSQLite from "@moduletrace/bun-sqlite";
import syncMcpServer from "@/src/functions/backend/db/extensions/sync-mcp-server";

/**
 * Lists every enabled remote MCP server's tools again (`syncMcpServer`),
 * so bots get tools the server added and lose ones it dropped. stdio
 * servers are left alone: listing them means starting them, and they're
 * refreshed when saved or from Settings, under MCPs.
 */
export default async function syncMcpServers() {
    const rows =
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM mcp_servers WHERE enabled = 1 AND transport = 'remote'`,
            })
        ).payload || [];

    for (const row of rows) {
        await syncMcpServer({ mcp_server_id: row.id });
    }
}
