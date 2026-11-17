import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { AppData } from "@/src/data/app-data";
import { SiteData } from "@/src/data/site-data";
import assertBrowserUrl from "@/src/functions/backend/db/browsers/assert-browser-url";
import pinBrowserFetch from "./pin-browser-fetch";

type Params = {
    /**
     * The server's MCP endpoint, e.g. `http://cobble-computer:8080/mcp`.
     */
    url: string;
    headers?: Record<string, string>;
    /**
     * Refuses redirects, for a URL a user supplied and `assertBrowserUrl`
     * checked: a redirect would lead past that check.
     */
    no_redirects?: boolean;
    signal?: AbortSignal;
};

/**
 * Connects to an MCP server over Streamable HTTP, falling back to the
 * older SSE transport. Close the client when the run is done.
 */
export default async function connectMcpServer({
    url,
    headers,
    no_redirects,
    signal,
}: Params): Promise<Client> {
    const endpoint = new URL(url);
    const request_init: RequestInit | undefined =
        headers || no_redirects ? { headers, redirect: no_redirects ? "error" : undefined } : undefined;
    const options = { signal, timeout: AppData.McpConnectTimeoutMs };

    // A user's browser URL is checked here and pinned to the addresses that
    // passed, so the transport connects to those and never re-resolves the
    // name (which a rebinding name would answer with a computer's address).
    const fetch = no_redirects ? pinBrowserFetch({ endpoint, addresses: await assertBrowserUrl({ url }) }) : undefined;

    try {
        const client = newClient();
        await client.connect(
            new StreamableHTTPClientTransport(endpoint, { requestInit: request_init, fetch }),
            options,
        );
        return client;
    } catch (error: unknown) {
        if (signal?.aborted) throw error;

        try {
            const client = newClient();
            await client.connect(
                new SSEClientTransport(endpoint, { requestInit: request_init, fetch }),
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
