import type { BUN_SQLITE_COBBLE_MCP_SERVERS } from "@/db/types/db";
import type { McpServerStatus, McpTransport } from "@/src/dict/mcp-dict";
import type { McpServerRecord, McpToolInfo } from "@/src/types";
import parseJsonColumn from "./parse-json-column";

type Params = {
    row: BUN_SQLITE_COBBLE_MCP_SERVERS;
};

/**
 * An `mcp_servers` row with its JSON columns read.
 */
export default function parseMcpServerRow({ row }: Params): McpServerRecord {
    return {
        id: Number(row.id),
        name: row.name || "",
        slug: row.slug || "",
        description: row.description || "",
        transport: (row.transport || "remote") as McpTransport,
        url: row.url || "",
        headers: parseJsonColumn<Record<string, string>>({ text: row.headers, fallback: {} }),
        command: row.command || "",
        setup_command: row.setup_command || "",
        env: parseJsonColumn<Record<string, string>>({ text: row.env, fallback: {} }),
        excluded_tools: parseJsonColumn<string[]>({ text: row.excluded_tools, fallback: [] }),
        tools: parseJsonColumn<McpToolInfo[]>({ text: row.tools_cache, fallback: [] }),
        all_bots: row.all_bots == 1,
        enabled: row.enabled != 0,
        status: (row.status || "untested") as McpServerStatus,
        last_error: row.last_error || "",
        last_synced_at: typeof row.last_synced_at == "number" ? row.last_synced_at : null,
        updated_at: typeof row.updated_at == "number" ? row.updated_at : null,
    };
}
