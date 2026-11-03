import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../types";
import mcpResultToText from "./mcp-result-to-text";

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
    /**
     * What a reading of an image this tool returns should look for, for a
     * model that can't see it.
     */
    image_focus?: string;
    redact?: (text: string) => string;
};

/**
 * One MCP server tool as a harness tool. Arguments go to the server as the
 * model wrote them (the server checks them against its own schema);
 * results come back via `mcpResultToText`, the text redacted and images
 * (screenshots) handed back for the run to show the model, or have read
 * (and the reading redacted) for one that can't see.
 */
export default function mcpHarnessTool({
    name,
    tool,
    client,
    image_focus,
    redact = (text) => text,
}: Params): HarnessTool {
    return {
        name: name || tool.name,
        description: tool.description || tool.name,
        parameters: tool.input_schema,
        run: async ({ args, signal }) => {
            try {
                const connected = typeof client == "function" ? await client() : client;

                const { text, images } = mcpResultToText({
                    result: await connected.callTool({ name: tool.name, arguments: args }, undefined, {
                        signal,
                        timeout: AppData.McpToolTimeoutMs,
                        resetTimeoutOnProgress: true,
                    }),
                });

                if (!images.length) return redact(text);

                return {
                    text: redact(text),
                    images: images.map(({ data, mime_type }) => ({
                        url: `data:${mime_type};base64,${data}`,
                        focus: image_focus,
                        redact,
                    })),
                };
            } catch (error: unknown) {
                if (error instanceof Error) error.message = redact(error.message);
                throw error;
            }
        },
    };
}
