import { z } from "zod";
import createExtensionProposal from "@/src/functions/backend/db/extension-proposals/create-extension-proposal";
import grabExtensionProposalView from "@/src/functions/backend/db/extension-proposals/grab-extension-proposal-view";
import grabMcpServer from "@/src/functions/backend/db/extensions/grab-mcp-server";
import proposalRef from "@/src/utils/proposal-ref";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import describeProposalForBot from "./describe-proposal-for-bot";
import mergeMcpServerChanges, { type McpServerChanges } from "./merge-mcp-server-changes";
import { ProposalResearchFields } from "./proposal-research-schema";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Called with the proposal's ref, so the reply always carries its card.
     */
    onPropose?: (params: { ref: string }) => void;
};

type Args = McpServerChanges & {
    mcp_server_id?: number;
    research: string;
    sources: string[];
};

/**
 * Lets the coordinator propose a remote MCP server, or a change to where
 * one connects and what it sends, for the user to confirm from a card in
 * the chat. Nothing is saved or connected until they do: the card shows
 * the host, every key it sends (saved or missing, worked out by the app)
 * and the bot's background check.
 */
export default function proposeMcpServerTool({ user_id, bot_id, session_id, workspace_id, onPropose }: Params): HarnessTool<Args> {
    return {
        name: "propose_mcp_server",
        description: `Propose adding a remote MCP server, or changing an existing one's url or headers (mcp_server_id), for the user to confirm. Nothing is saved or connected until they press Confirm on the card. First run a background check with your web tools: find the publisher's own docs, make sure the url is their official server, and note what it needs. Give the findings in research and the pages in sources. url is the full https URL with its host written out. headers change entry by entry (a null value removes one); for a key, refer to an env as {{env.KEY}}, e.g. "Authorization": "Bearer {{env.GITHUB_TOKEN}}", reusing a saved env when it's the same key, and never write a key's value in. Check list_extensions first: if the server is already there, propose a change to it instead. A server that runs a command here (stdio) is set up by the user in Settings, under MCPs.`,
        schema: z.object({
            mcp_server_id: z.number().int().positive().optional(),
            name: z.string().trim().max(80).optional(),
            description: z.string().trim().max(1000).optional(),
            url: z.string().trim().max(2000).optional(),
            headers: z.record(z.string().trim().min(1).max(200), z.string().max(4000).nullable()).optional(),
            excluded_tools: z.array(z.string().max(200)).max(500).optional(),
            enabled: z.boolean().optional(),
            all_bots: z.boolean().optional(),
            ...ProposalResearchFields,
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const { mcp_server_id, research, sources, ...changes } = args;
            const current = mcp_server_id ? await grabMcpServer({ mcp_server_id }) : null;
            const data = mergeMcpServerChanges({ current, changes });

            const id = await createExtensionProposal({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                kind: "mcp",
                data,
                research,
                sources,
            });

            onPropose?.({ ref: proposalRef({ id }) });

            return describeProposalForBot({ view: await grabExtensionProposalView({ proposal_id: id, user_id }) });
        },
    };
}
