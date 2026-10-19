import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import mcpResultToText, { type McpImage } from "./mcp-result-to-text";

type Params = {
    client: Client;
    /**
     * Tool names to leave out.
     */
    exclude?: readonly string[];
    describeImage?: (image: McpImage) => Promise<string>;
    /**
     * Applied to every result (and error) before the model sees it, e.g.
     * to hide secret values.
     */
    redact?: (text: string) => string;
};

/**
 * Every tool an MCP server offers, as harness tools. Arguments go to the
 * server as the model wrote them (the server checks them against its own
 * schema); results come back as text via `mcpResultToText`.
 */
export default async function grabMcpTools({
    client,
    exclude = [],
    describeImage,
    redact = (text) => text,
}: Params): Promise<HarnessTool[]> {
    const tools: HarnessTool[] = [];
    let cursor: string | undefined;

    do {
        const page = await client.listTools(cursor ? { cursor } : undefined, {
            timeout: AppData.McpConnectTimeoutMs,
        });

        for (const tool of page.tools) {
            if (exclude.includes(tool.name)) continue;

            tools.push({
                name: tool.name,
                description: tool.description || tool.title || tool.name,
                parameters: tool.inputSchema as Record<string, unknown>,
                run: async ({ args, signal }) => {
                    try {
                        return redact(
                            await mcpResultToText({
                                result: await client.callTool(
                                    { name: tool.name, arguments: args },
                                    undefined,
                                    {
                                        signal,
                                        timeout: AppData.McpToolTimeoutMs,
                                        resetTimeoutOnProgress: true,
                                    },
                                ),
                                describeImage,
                            }),
                        );
                    } catch (error: unknown) {
                        if (error instanceof Error) error.message = redact(error.message);
                        throw error;
                    }
                },
            });
        }

        cursor = page.nextCursor;
    } while (cursor);

    return tools;
}
