import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AppData } from "@/src/data/app-data";
import { SiteData } from "@/src/data/site-data";
import type { McpServerRecord } from "@/src/types";
import grabMcpDir from "./grab-mcp-dir";
import hostShell from "./host-shell";
import runMcpSetup from "./run-mcp-setup";

type Params = {
    server: McpServerRecord;
    /**
     * Its environment (`grabMcpStdioEnv`).
     */
    env: Record<string, string>;
};

/**
 * Starts a stdio MCP server after its setup (`runMcpSetup`), with the
 * host's shell in its directory, and connects to it. A failed start
 * throws with the last lines it wrote to stderr. Closing the client stops
 * it.
 */
export default async function startStdioMcpClient({ server, env }: Params) {
    await runMcpSetup({ server, env });

    const transport = new StdioClientTransport({
        command: hostShell(),
        args: ["-c", server.command],
        cwd: await grabMcpDir({ server_id: server.id }),
        env,
        stderr: "pipe",
    });
    let stderr = "";

    transport.stderr?.on("data", (chunk: Buffer) => {
        stderr = `${stderr}${chunk.toString()}`.slice(-4000);
    });

    const client = new Client({ name: SiteData["SiteSlug"], version: "1.0.0" });

    try {
        await client.connect(transport, { timeout: AppData.McpConnectTimeoutMs * 4 });
    } catch (error) {
        await client.close().catch(() => {});
        throw new Error(
            `Couldn't start ${server.name}: ${error instanceof Error ? error.message : String(error)}${
                stderr.trim() ? `\n${stderr.trim().slice(-2000)}` : ""
            }`,
        );
    }

    return { client, transport };
}
