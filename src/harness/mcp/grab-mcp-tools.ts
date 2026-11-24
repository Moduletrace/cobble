import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { HarnessTool } from "../types";
import listMcpTools from "./list-mcp-tools";
import mcpHarnessTool from "./mcp-harness-tool";

type Params = {
    /**
     * The connected client, or how to connect on the first call and again
     * after a lost session.
     */
    client: Client | (() => Promise<Client>);
    /**
     * Drops a lost connection so the next call connects again
     * (`mcpHarnessTool`).
     */
    reconnect?: () => Promise<void>;
    /**
     * Tool names to leave out.
     */
    exclude?: readonly string[];
    /**
     * What a reading of a returned image should look for.
     */
    image_focus?: string;
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
    reconnect,
    exclude = [],
    image_focus,
    redact,
}: Params): Promise<HarnessTool[]> {
    const connected = typeof client == "function" ? await client() : client;

    return (await listMcpTools({ client: connected }))
        .filter((tool) => !exclude.includes(tool.name))
        .map((tool) => mcpHarnessTool({ tool, client, reconnect, image_focus, redact }));
}
