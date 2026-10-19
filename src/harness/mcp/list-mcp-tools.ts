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

    do {
        const page = await client.listTools(cursor ? { cursor } : undefined, {
            timeout: AppData.McpConnectTimeoutMs,
        });

        for (const tool of page.tools) {
            tools.push({
                name: tool.name,
                description: tool.description || tool.title || tool.name,
                input_schema: tool.inputSchema as Record<string, unknown>,
            });
        }

        cursor = page.nextCursor;
    } while (cursor);

    return tools;
}
