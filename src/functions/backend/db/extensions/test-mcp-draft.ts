import testMcpServer from "@/src/harness/mcp/test-mcp-server";
import type { TestMcpServerRequest } from "@/src/schemas/extension-schema";
import type { McpToolInfo } from "@/src/types";
import mcpServerSlug from "@/src/utils/mcp-server-slug";
import redactSecrets from "@/src/utils/redact-secrets";
import grabRunEnvs from "./grab-run-envs";

type Params = {
    data: TestMcpServerRequest;
};

/**
 * Connects to an MCP server as its form has it (saved or not) and lists
 * its tools, saving nothing. Never throws for the server's own failure:
 * returns why, secrets blanked out.
 */
export default async function testMcpDraft({
    data,
}: Params): Promise<{ ok: true; tools: McpToolInfo[] } | { ok: false; error: string }> {
    const envs = await grabRunEnvs();

    try {
        const tools = await testMcpServer({
            server: {
                id: data.mcp_server_id || 0,
                name: data.name || "The MCP server",
                slug: mcpServerSlug({ name: data.name }),
                description: data.description,
                transport: data.transport,
                url: data.url,
                headers: data.headers,
                command: data.command,
                setup_command: data.setup_command,
                env: data.env,
                excluded_tools: data.excluded_tools,
                tools: [],
                all_bots: data.all_bots,
                enabled: data.enabled,
                status: "untested",
                last_error: "",
                last_synced_at: null,
            },
            envs,
        });

        return { ok: true, tools };
    } catch (error: unknown) {
        return {
            ok: false,
            error: redactSecrets({
                text: error instanceof Error ? error.message : String(error),
                secrets: envs.filter((env) => env.secret),
            }).slice(0, 4000),
        };
    }
}
