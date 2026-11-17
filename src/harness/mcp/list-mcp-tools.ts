import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AppData } from "@/src/data/app-data";
import type { McpToolInfo } from "@/src/types";

type Params = {
    client: Client;
};

/**
 * Every tool an MCP server offers, page by page.
 */
export default async function listMcpTools({ client }: Params): Promise<McpToolInfo[]> {
    const tools: McpToolInfo[] = [];
    let cursor: string | undefined;
    let pages = 0;

    do {
        const page = await client.listTools(cursor ? { cursor } : undefined, {
            timeout: AppData.McpConnectTimeoutMs,
        });

        for (const tool of page.tools) {
            if (tools.length >= AppData.McpToolListMaxTools) return tools;
            tools.push({
                name: tool.name,
                description: tool.description || tool.title || tool.name,
                input_schema: tool.inputSchema as Record<string, unknown>,
            });
        }

        pages += 1;
        const next = page.nextCursor;
        // A server handing back the same cursor would page forever (M11).
        if (next && next === cursor) break;
        cursor = next;
    } while (cursor && pages < AppData.McpToolListMaxPages);

    return tools;
}
