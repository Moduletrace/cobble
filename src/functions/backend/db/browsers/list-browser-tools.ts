import connectMcpServer from "@/src/harness/mcp/connect-mcp-server";
import listMcpTools from "@/src/harness/mcp/list-mcp-tools";
import assertBrowserUrl from "./assert-browser-url";

type Params = {
    url: string;
    headers: Record<string, string>;
};

/**
 * Connects to a browser's MCP server as given and lists its tools. Throws
 * when the URL is refused or it can't connect.
 */
export default async function listBrowserTools({ url, headers }: Params) {
    await assertBrowserUrl({ url });

    const client = await connectMcpServer({ url, headers, no_redirects: true });

    try {
        return await listMcpTools({ client });
    } finally {
        await client.close().catch(() => {});
    }
}
