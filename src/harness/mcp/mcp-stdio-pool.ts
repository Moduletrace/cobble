import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AppData } from "@/src/data/app-data";
import { SiteData } from "@/src/data/site-data";
import type { McpServerRecord } from "@/src/types";
import grabMcpDir from "./grab-mcp-dir";
import grabMcpStdioEnv from "./grab-mcp-stdio-env";
import hostShell from "./host-shell";
import runMcpSetup from "./run-mcp-setup";

type Entry = {
    /**
     * The command, setup and environment it was started with: a change
     * restarts it.
     */
    key: string;
    client: Promise<Client>;
    transport?: StdioClientTransport;
    timer?: ReturnType<typeof setTimeout>;
};

/**
 * The stdio MCP servers running in this process, one per server, shared by
 * every run.
 */
const pool = new Map<number, Entry>();

type Params = {
    server: McpServerRecord;
    envs: { key: string; value: string }[];
};

/**
 * A connected client for a stdio MCP server, started on first use (after
 * its setup, `runMcpSetup`) with the host's shell in its directory, and
 * kept running for later calls until it's idle for `AppData.McpStdioIdleMs`,
 * its configuration changes, or it exits. Its stderr's last lines explain
 * a failed start.
 */
export default async function grabStdioMcpClient({ server, envs }: Params): Promise<Client> {
    const env = grabMcpStdioEnv({ server, envs });
    const key = String(Bun.hash(JSON.stringify([server.command, server.setup_command, env])));
    const existing = pool.get(server.id);

    if (existing?.key == key) {
        touch({ server_id: server.id, entry: existing });
        return existing.client;
    }

    if (existing) stopStdioMcpServer({ server_id: server.id });

    const entry = { key } as Entry;

    entry.client = start({ server, env, entry }).catch((error) => {
        if (pool.get(server.id) == entry) pool.delete(server.id);
        throw error;
    });

    pool.set(server.id, entry);
    touch({ server_id: server.id, entry });

    return entry.client;
}

/**
 * Stops a stdio MCP server running in this process, if it is (on a
 * change, a delete, or idle).
 */
export function stopStdioMcpServer({ server_id }: { server_id: number }) {
    const entry = pool.get(server_id);

    if (!entry) return;

    pool.delete(server_id);
    clearTimeout(entry.timer);
    entry.client.then((client) => client.close()).catch(() => {});
}

async function start({ server, env, entry }: { server: McpServerRecord; env: Record<string, string>; entry: Entry }) {
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

    entry.transport = transport;

    const client = new Client({ name: SiteData["SiteSlug"], version: "1.0.0" });

    client.onclose = () => {
        if (pool.get(server.id) == entry) {
            pool.delete(server.id);
            clearTimeout(entry.timer);
        }
    };

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

    return client;
}

function touch({ server_id, entry }: { server_id: number; entry: Entry }) {
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
        if (pool.get(server_id) == entry) stopStdioMcpServer({ server_id });
    }, AppData.McpStdioIdleMs);
    entry.timer.unref?.();
}

/**
 * Children go with the app.
 */
process.once("exit", () => {
    for (const entry of pool.values()) {
        const pid = entry.transport?.pid;
        if (pid) {
            try {
                process.kill(pid);
            } catch {}
        }
    }
});
