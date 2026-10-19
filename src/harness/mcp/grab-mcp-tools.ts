import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { HarnessTool } from "../types";
import listMcpTools from "./list-mcp-tools";
import mcpHarnessTool from "./mcp-harness-tool";
import type { McpImage } from "./mcp-result-to-text";

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
 * Every tool an MCP server offers, as harness tools (`mcpHarnessTool`).
 */
export default async function grabMcpTools({
    client,
    exclude = [],
    describeImage,
    redact,
}: Params): Promise<HarnessTool[]> {
    return (await listMcpTools({ client }))
        .filter((tool) => !exclude.includes(tool.name))
        .map((tool) => mcpHarnessTool({ tool, client, describeImage, redact }));
}
