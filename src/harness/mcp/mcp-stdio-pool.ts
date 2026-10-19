import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AppData } from "@/src/data/app-data";
import type { McpServerRecord } from "@/src/types";
import grabMcpStdioEnv from "./grab-mcp-stdio-env";
import startStdioMcpClient from "./start-stdio-mcp-client";

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
 * A connected client for a stdio MCP server, started on first use
 * (`startStdioMcpClient`) and kept running for later calls until it's idle for `AppData.McpStdioIdleMs`,
 * its configuration changes, or it exits.
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
    const { client, transport } = await startStdioMcpClient({ server, env });

    entry.transport = transport;

    client.onclose = () => {
        if (pool.get(server.id) == entry) {
            pool.delete(server.id);
            clearTimeout(entry.timer);
        }
    };

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
