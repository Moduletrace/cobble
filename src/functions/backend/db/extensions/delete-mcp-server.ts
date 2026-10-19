import BunSQLite from "@moduletrace/bun-sqlite";
import { stopStdioMcpServer } from "@/src/harness/mcp/mcp-stdio-pool";
import grabMcpServer from "./grab-mcp-server";

type Params = {
    mcp_server_id: number | string;
};

/**
 * Deletes an MCP server (its attachments go with it) and stops it if it's
 * running here. Its directory, with whatever its setup installed, stays.
 */
export default async function deleteMcpServer({ mcp_server_id }: Params) {
    const server = await grabMcpServer({ mcp_server_id });

    stopStdioMcpServer({ server_id: server.id });

    const res = await BunSQLite.sql({ sql: `DELETE FROM mcp_servers WHERE id = ?`, values: [server.id] });

    if (!res.success) throw new Error(`Couldn't delete the MCP server: ${res.error}`);

    return server;
}
