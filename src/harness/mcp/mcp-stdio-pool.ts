import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AppData } from "@/src/data/app-data";
import type { McpServerRecord } from "@/src/types";
import grabMcpStdioEnv from "./grab-mcp-stdio-env";
import killProcessTree from "./kill-process-tree";
import startStdioMcpClient from "./start-stdio-mcp-client";

type Entry = {
    server_id: number;
    /**
     * The pool key: the server's identity and the environment it was
     * started with. A change restarts it.
     */
    key: string;
    client: Promise<Client>;
    transport?: StdioClientTransport;
    timer?: ReturnType<typeof setTimeout>;
};

/**
 * The stdio MCP servers running in this process, keyed by server AND
 * environment (M12): two runs whose resolved envs differ each keep their
 * own client instead of stopping each other's; runs with the same env
 * share one. Each is kept until idle for `AppData.McpStdioIdleMs`, its
 * configuration changes, or it exits.
 */
const pool = new Map<string, Entry>();

type Params = {
    server: McpServerRecord;
    envs: { key: string; value: string }[];
};

/**
 * A connected client for a stdio MCP server, started on first use
 * (`startStdioMcpClient`) and kept running for later calls.
 */
export default async function grabStdioMcpClient({ server, envs }: Params): Promise<Client> {
    const env = grabMcpStdioEnv({ server, envs });
    const key = `${server.id}:${Bun.hash(JSON.stringify([server.command, server.setup_command, env]))}`;
    const existing = pool.get(key);

    if (existing) {
        touch({ key, entry: existing });
        return existing.client;
    }

    const entry = { server_id: server.id, key } as Entry;

    entry.client = start({ server, env, entry }).catch((error) => {
        if (pool.get(key) == entry) pool.delete(key);
        throw error;
    });

    pool.set(key, entry);
    touch({ key, entry });

    return entry.client;
}

/**
 * Stops every stdio MCP client running in this process for a server (on a
 * change, a delete, or idle), whatever environment each was started with.
 */
export function stopStdioMcpServer({ server_id }: { server_id: number }) {
    for (const [key, entry] of pool) {
        if (entry.server_id == server_id) stopEntry({ key, entry });
    }
}

function stopEntry({ key, entry }: { key: string; entry: Entry }) {
    if (pool.get(key) != entry) return;

    pool.delete(key);
    clearTimeout(entry.timer);
    entry.client.then((client) => client.close()).catch(() => {});
}

async function start({ server, env, entry }: { server: McpServerRecord; env: Record<string, string>; entry: Entry }) {
    const { client, transport } = await startStdioMcpClient({ server, env });

    entry.transport = transport;

    client.onclose = () => {
        if (pool.get(entry.key) == entry) {
            pool.delete(entry.key);
            clearTimeout(entry.timer);
        }
    };

    return client;
}

function touch({ key, entry }: { key: string; entry: Entry }) {
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
        if (pool.get(key) == entry) stopEntry({ key, entry });
    }, AppData.McpStdioIdleMs);
    entry.timer.unref?.();
}

/**
 * Children go with the app, grandchildren too (M12).
 */
process.once("exit", () => {
    for (const entry of pool.values()) {
        const pid = entry.transport?.pid;
        if (pid) killProcessTree({ pid });
    }
});
