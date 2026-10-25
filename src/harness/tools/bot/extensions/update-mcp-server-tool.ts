import { z } from "zod";
import grabMcpServer from "@/src/functions/backend/db/extensions/grab-mcp-server";
import saveMcpServer from "@/src/functions/backend/db/extensions/save-mcp-server";
import syncMcpServer from "@/src/functions/backend/db/extensions/sync-mcp-server";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import mergeMcpServerChanges from "./merge-mcp-server-changes";

type Params = {
    user_id: number | string;
};

type Args = {
    mcp_server_id: number;
    name?: string;
    description?: string;
    excluded_tools?: string[];
    enabled?: boolean;
    all_bots?: boolean;
};

/**
 * Lets the coordinator change what an MCP server is called, which of its
 * tools bots get and whether it's on, then reconnects it. Where it
 * connects and what it sends are never changed here: those go through
 * `propose_mcp_server`, which the super admin confirms.
 */
export default function updateMcpServerTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "update_mcp_server",
        description: `Change an MCP server's name, description, excluded_tools (the server's tools bots don't get; replaces the list), enabled or all_bots (gives it to every bot now and every new one), then reconnect it and list its tools. Every field you leave out stays. To add a server, or change its url or headers, use propose_mcp_server: the user confirms those.`,
        schema: z.object({
            mcp_server_id: z.number().int().positive(),
            name: z.string().trim().max(80).optional(),
            description: z.string().trim().max(1000).optional(),
            excluded_tools: z.array(z.string().max(200)).max(500).optional(),
            enabled: z.boolean().optional(),
            all_bots: z.boolean().optional(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const { mcp_server_id, ...changes } = args;
            const current = await grabMcpServer({ mcp_server_id });
            const data = mergeMcpServerChanges({ current, changes });

            await saveMcpServer({ user_id, data });

            const sync = data.enabled ? await syncMcpServer({ mcp_server_id }) : null;
            const saved = await grabMcpServer({ mcp_server_id });

            await logEvent({
                title: "MCP server changed",
                category: "system",
                user_id: Number(user_id),
                plain_text: `The coordinator changed the MCP server ${saved.name} (#${mcp_server_id}).`,
                metadata: { mcp_server_id },
            });

            const head = `MCP server #${mcp_server_id} "${saved.name}" is saved.`;

            if (!sync) return `${head} It's off, so it wasn't connected.`;

            if (!sync.ok) return `${head} It didn't connect, so bots get none of its tools until it does: ${sync.error}`;

            const names = sync.tools.map((tool) => tool.name).join(", ");

            return `${head} It connected and lists ${sync.tools.length} ${sync.tools.length == 1 ? "tool" : "tools"}${names ? `: ${names}` : ""}.`;
        },
    };
}
