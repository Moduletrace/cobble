import grabBotExtensions from "@/src/functions/backend/db/extensions/grab-bot-extensions";
import grabRunEnvs from "@/src/functions/backend/db/extensions/grab-run-envs";
import mcpToolName from "@/src/utils/mcp-tool-name";
import redactSecrets from "@/src/utils/redact-secrets";
import mcpHarnessTool from "../../mcp/mcp-harness-tool";
import openMcpServer from "../../mcp/open-mcp-server";
import readImage from "../../media/read-image";
import type { HarnessTool } from "../../types";
import buildCustomTool from "../custom/build-custom-tool";

type Params = {
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Where script tools run: the task's computer, or in chat the bot's
     * current one. None leaves script tools out.
     */
    computer_id?: number | string | null;
    /**
     * Names the run's built-in tools already use: they win.
     */
    taken?: string[];
    signal?: AbortSignal;
};

export type OpenBotExtensions = {
    tools: HarnessTool[];
    /**
     * For the system prompt, only when something's wrong (an MCP server
     * with no tools listed), so the bot can say so. Empty otherwise.
     */
    note: string;
    close: () => Promise<void>;
};

/**
 * The MCP servers' and custom tools' tools a bot gets on one run
 * (`grabBotExtensions`), as harness tools. MCP tools are built from each
 * server's last listing (`<slug>__<tool>`) and connect on their first call,
 * so a run that doesn't use them never waits on them. Secret env values are
 * blanked out of every result. Call `close` when the run ends.
 */
export default async function openBotExtensions({
    bot_id,
    workspace_id,
    computer_id,
    taken = [],
    signal,
}: Params): Promise<OpenBotExtensions> {
    const { servers, tools } = await grabBotExtensions({ bot_id, workspace_id });

    if (!servers.length && !tools.length) return { tools: [], note: "", close: async () => {} };

    const envs = await grabRunEnvs({ bot_id, workspace_id });
    const secrets = envs.filter((env) => env.secret);
    const redact = (text: string) => redactSecrets({ text, secrets });
    const names = new Set(taken);
    const result: HarnessTool[] = [];
    const notes: string[] = [];
    const opened: ReturnType<typeof openMcpServer>[] = [];

    const add = (tool: HarnessTool | null) => {
        if (!tool || names.has(tool.name)) return;
        names.add(tool.name);
        result.push(tool);
    };

    for (const tool of tools) {
        add(buildCustomTool({ tool, envs, computer_id, bot_id, workspace_id }));
    }

    for (const server of servers) {
        const listed = server.tools.filter((tool) => !server.excluded_tools.includes(tool.name));

        if (!listed.length) {
            notes.push(
                `- ${server.name}: ${server.status == "error" ? `unavailable (${redact(server.last_error).slice(0, 300)})` : "no tools listed yet"}.`,
            );
            continue;
        }

        const open = openMcpServer({ server, envs, signal });
        opened.push(open);

        for (const tool of listed) {
            add(
                mcpHarnessTool({
                    name: mcpToolName({ slug: server.slug, name: tool.name }),
                    tool: { ...tool, description: `${server.name}: ${tool.description}` },
                    client: open.client,
                    redact,
                    describeImage: ({ data, mime_type }) =>
                        readImage({ url: `data:${mime_type};base64,${data}`, signal, bot_id, workspace_id }),
                }),
            );
        }
    }

    return {
        tools: result,
        note: notes.length
            ? `These MCP servers were set up for you but you can't use them right now; if the user needs them, say so (an admin fixes them in Settings, under MCPs):\n${notes.join("\n")}`
            : "",
        close: async () => {
            await Promise.all(opened.map((open) => open.close()));
        },
    };
}
