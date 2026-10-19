import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import mcpResultToText, { type McpImage } from "./mcp-result-to-text";

type Params = {
    /**
     * What the model calls it. Defaults to the server's name for it.
     */
    name?: string;
    /**
     * The tool as the server lists it.
     */
    tool: { name: string; description?: string; input_schema: Record<string, unknown> };
    /**
     * The connected client, or how to get it on the first call.
     */
    client: Client | (() => Promise<Client>);
    describeImage?: (image: McpImage) => Promise<string>;
    redact?: (text: string) => string;
};

/**
 * One MCP server tool as a harness tool. Arguments go to the server as the
 * model wrote them (the server checks them against its own schema);
 * results come back as text via `mcpResultToText`, redacted.
 */
export default function mcpHarnessTool({
    name,
    tool,
    client,
    describeImage,
    redact = (text) => text,
}: Params): HarnessTool {
    return {
        name: name || tool.name,
        description: tool.description || tool.name,
        parameters: tool.input_schema,
        run: async ({ args, signal }) => {
            try {
                const connected = typeof client == "function" ? await client() : client;

                return redact(
                    await mcpResultToText({
                        result: await connected.callTool({ name: tool.name, arguments: args }, undefined, {
                            signal,
                            timeout: AppData.McpToolTimeoutMs,
                            resetTimeoutOnProgress: true,
                        }),
                        describeImage,
                    }),
                );
            } catch (error: unknown) {
                if (error instanceof Error) error.message = redact(error.message);
                throw error;
            }
        },
    };
}
