import type { McpServerRecord } from "@/src/types";
import fillTemplate from "@/src/utils/fill-template";
import connectMcpServer from "./connect-mcp-server";
import grabMcpStdioEnv from "./grab-mcp-stdio-env";
import listMcpTools from "./list-mcp-tools";
import startStdioMcpClient from "./start-stdio-mcp-client";

type Params = {
    /**
     * As it would be saved; it may not be yet.
     */
    server: McpServerRecord;
    envs: { key: string; value: string }[];
};

/**
 * Connects to an MCP server as configured, lists its tools and
 * disconnects, outside the stdio pool, so a form can check a server
 * before it's saved. A stdio one runs its setup first, in its own
 * directory (a new server's in `mcp/0`). Throws when it can't connect.
 */
export default async function testMcpServer({ server, envs }: Params) {
    const client =
        server.transport == "stdio"
            ? (await startStdioMcpClient({ server, env: grabMcpStdioEnv({ server, envs }) })).client
            : await connectMcpServer({
                  url: fillTemplate({ template: server.url, envs }),
                  headers: Object.fromEntries(
                      Object.entries(server.headers).map(([key, value]) => [key, fillTemplate({ template: value, envs })]),
                  ),
              });

    try {
        return await listMcpTools({ client });
    } finally {
        await client.close().catch(() => {});
    }
}
