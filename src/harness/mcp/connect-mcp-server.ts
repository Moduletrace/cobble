import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { AppData } from "@/src/data/app-data";
import { SiteData } from "@/src/data/site-data";

type Params = {
    /**
     * The server's MCP endpoint, e.g. `http://cobble-computer:8080/mcp`.
     */
    url: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
};

/**
 * Connects to an MCP server over Streamable HTTP, falling back to the
 * older SSE transport. Close the client when the run is done.
 */
export default async function connectMcpServer({
    url,
    headers,
    signal,
}: Params): Promise<Client> {
    const endpoint = new URL(url);
    const request_init = headers ? { headers } : undefined;
    const options = { signal, timeout: AppData.McpConnectTimeoutMs };

    try {
        const client = newClient();
        await client.connect(
            new StreamableHTTPClientTransport(endpoint, { requestInit: request_init }),
            options,
        );
        return client;
    } catch (error: unknown) {
        if (signal?.aborted) throw error;

        try {
            const client = newClient();
            await client.connect(
                new SSEClientTransport(endpoint, { requestInit: request_init }),
                options,
            );
            return client;
        } catch {
            throw new Error(
                `Couldn't connect to the MCP server at ${endpoint.origin}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }
}

function newClient() {
    return new Client({ name: SiteData["SiteSlug"], version: "1.0.0" });
}
