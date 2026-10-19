import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import recordMcpServerConnection from "@/src/functions/backend/db/extensions/record-mcp-server-connection";
import type { McpServerRecord } from "@/src/types";
import fillTemplate from "@/src/utils/fill-template";
import connectMcpServer from "./connect-mcp-server";
import grabStdioMcpClient from "./mcp-stdio-pool";

type Params = {
    server: McpServerRecord;
    /**
     * What its templates (`{{env.KEY}}`) read.
     */
    envs: { key: string; value: string }[];
    signal?: AbortSignal;
};

/**
 * How one run reaches an MCP server, without connecting yet: `client()`
 * connects on the first call and is reused after. A remote server gets
 * its own connection for the run (closed by `close`); a stdio server is
 * shared through the process's pool and keeps running. Whether it
 * connected is saved on the server when that changes
 * (`recordMcpServerConnection`).
 */
export default function openMcpServer({ server, envs, signal }: Params) {
    let remote: Promise<Client> | undefined;

    let recorded = false;

    /**
     * Once per run: an error every time (its message may change), a
     * success only when the server was failing.
     */
    const record = <T>(connecting: Promise<T>) =>
        connecting.then(
            async (client) => {
                if (!recorded && server.status != "ok") await recordMcpServerConnection({ mcp_server_id: server.id });
                recorded = true;
                return client;
            },
            async (error: unknown) => {
                if (!signal?.aborted) {
                    await recordMcpServerConnection({
                        mcp_server_id: server.id,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
                throw error;
            },
        );

    const client = () => {
        if (server.transport == "stdio") return record(grabStdioMcpClient({ server, envs }));

        remote ||= connectMcpServer({
            url: fillTemplate({ template: server.url, envs }),
            headers: Object.fromEntries(
                Object.entries(server.headers).map(([key, value]) => [key, fillTemplate({ template: value, envs })]),
            ),
            signal,
        }).catch((error) => {
            remote = undefined;
            throw error;
        });

        return record(remote);
    };

    const close = async () => {
        if (!remote) return;
        await (await remote.catch(() => null))?.close().catch(() => {});
    };

    return { client, close };
}
