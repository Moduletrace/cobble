import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS, BUN_SQLITE_COBBLE_MCP_SERVERS } from "@/db/types/db";
import botExtensionsSql from "@/src/utils/bot-extensions-sql";
import parseCustomToolRow from "./parse-custom-tool-row";
import parseMcpServerRow from "./parse-mcp-server-row";

type Params = {
    bot_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * The MCP servers and custom tools a bot gets on one run
 * (`botExtensionsSql`): every bot's, its own, and its workspace's there.
 */
export default async function grabBotExtensions({ bot_id, workspace_id }: Params) {
    const [servers, tools] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_MCP_SERVERS>(botExtensionsSql({ kind: "mcp", bot_id, workspace_id })),
        BunSQLite.sql<BUN_SQLITE_COBBLE_CUSTOM_TOOLS>(botExtensionsSql({ kind: "tool", bot_id, workspace_id })),
    ]);

    return {
        servers: (servers.payload || []).map((row) => parseMcpServerRow({ row })),
        tools: (tools.payload || []).map((row) => parseCustomToolRow({ row })),
    };
}
