import BunSQLite from "@moduletrace/bun-sqlite";
import listMcpTools from "@/src/harness/mcp/list-mcp-tools";
import openMcpServer from "@/src/harness/mcp/open-mcp-server";
import runMcpSetup from "@/src/harness/mcp/run-mcp-setup";
import grabMcpStdioEnv from "@/src/harness/mcp/grab-mcp-stdio-env";
import { stopStdioMcpServer } from "@/src/harness/mcp/mcp-stdio-pool";
import redactSecrets from "@/src/utils/redact-secrets";
import grabMcpServer from "./grab-mcp-server";
import grabRunEnvs from "./grab-run-envs";

type Params = {
    mcp_server_id: number | string;
    /**
     * Runs a stdio server's setup again first, even if it already ran.
     */
    reinstall?: boolean;
};

/**
 * Connects to an MCP server (a stdio one is started, after its setup) and
 * saves the tools it lists, which is what runs build their tools from.
 * Saves the outcome on the server (`status`, `last_error`, secrets
 * blanked out) and returns it; never throws for the server's own failure.
 */
export default async function syncMcpServer({ mcp_server_id, reinstall }: Params) {
    const server = await grabMcpServer({ mcp_server_id });
    const envs = await grabRunEnvs();
    const open = openMcpServer({ server, envs });
    const now = Date.now();

    try {
        if (reinstall && server.transport == "stdio") {
            stopStdioMcpServer({ server_id: server.id });
            await runMcpSetup({ server, env: grabMcpStdioEnv({ server, envs }), force: true });
        }

        const tools = await listMcpTools({ client: await open.client() });

        await BunSQLite.sql({
            sql: `UPDATE mcp_servers SET tools_cache = ?, status = 'ok', last_error = '', last_synced_at = ?, updated_at = ? WHERE id = ?`,
            values: [JSON.stringify(tools), now, now, server.id],
        });

        return { ok: true as const, tools };
    } catch (error: unknown) {
        const message = redactSecrets({
            text: error instanceof Error ? error.message : String(error),
            secrets: envs.filter((env) => env.secret),
        }).slice(0, 4000);

        await BunSQLite.sql({
            sql: `UPDATE mcp_servers SET status = 'error', last_error = ?, last_synced_at = ?, updated_at = ? WHERE id = ?`,
            values: [message, now, now, server.id],
        });

        return { ok: false as const, error: message };
    } finally {
        await open.close();
    }
}
