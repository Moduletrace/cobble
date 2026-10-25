import { z } from "zod";
import {
    CustomToolHttpMethods,
    CustomToolKinds,
    CustomToolScriptLanguages,
    type CustomToolKind,
    type CustomToolScriptLanguage,
} from "@/src/dict/custom-tool-dict";
import createExtensionProposal from "@/src/functions/backend/db/extension-proposals/create-extension-proposal";
import grabExtensionProposalView from "@/src/functions/backend/db/extension-proposals/grab-extension-proposal-view";
import grabCustomTool from "@/src/functions/backend/db/extensions/grab-custom-tool";
import proposalRef from "@/src/utils/proposal-ref";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import describeProposalForBot from "./describe-proposal-for-bot";
import mergeCustomToolChanges, { type CustomToolChanges } from "./merge-custom-tool-changes";
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

type Args = CustomToolChanges & {
    custom_tool_id?: number;
    research: string;
    sources: string[];
};

/**
 * Lets the coordinator propose a custom tool, or a change to what one runs
 * and where it sends (its kind and config), for the user to confirm from a
 * card in the chat. Nothing is saved until they do: the card shows the
 * request or code, every key it sends (saved or missing, worked out by
 * the app) and the bot's background check.
 */
export default function proposeCustomToolTool({ user_id, bot_id, session_id, workspace_id, onPropose }: Params): HarnessTool<Args> {
    return {
        name: "propose_custom_tool",
        description: `Propose adding a custom tool bots can call, or changing an existing one's kind or config (custom_tool_id), for the user to confirm. Nothing is saved until they press Confirm on the card. First run a background check with your web tools on the API or service it calls (its official docs, the right endpoint, what it needs) and give the findings in research and the pages in sources. name is snake_case and can't be a built-in tool's; description tells bots what it does; parameters is the JSON schema of its arguments (an object schema, e.g. {"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}). kind and its config: "http" (method, url with its host written out, headers, body; the app sends it, {{args.x}} fills in an argument, with no body the arguments go as JSON; for a key refer to an env as {{env.KEY}} in a header, the body or the URL's path or query, reusing a saved env when it's the same key, never its value), "script" (language bash, python or javascript, and code; runs on the bot's computer, arguments as JSON in $COBBLE_ARGS and on stdin), "prompt" (prompt; one model turn with the bot's models, no envs). Changing one keeps the config fields you leave out while the kind stays; headers change entry by entry, a null value removing one. Check list_extensions first: if the tool is already there, propose a change to it instead.`,
        schema: z.object({
            custom_tool_id: z.number().int().positive().optional(),
            name: z.string().trim().max(80).optional(),
            description: z.string().trim().max(2000).optional(),
            kind: z.enum(CustomToolKinds.map((k) => k.value) as [CustomToolKind, ...CustomToolKind[]]).optional(),
            parameters: z.record(z.string(), z.unknown()).optional().describe("JSON schema of the arguments object"),
            config: z
                .object({
                    method: z.enum(CustomToolHttpMethods).optional(),
                    url: z.string().trim().max(4000).optional(),
                    headers: z.record(z.string().trim().min(1).max(200), z.string().max(4000).nullable()).optional(),
                    body: z.string().max(20000).optional(),
                    timeout_ms: z.number().int().positive().optional(),
                    language: z
                        .enum(CustomToolScriptLanguages.map((l) => l.value) as [CustomToolScriptLanguage, ...CustomToolScriptLanguage[]])
                        .optional(),
                    code: z.string().max(60000).optional(),
                    prompt: z.string().trim().max(20000).optional(),
                })
                .optional(),
            enabled: z.boolean().optional(),
            all_bots: z.boolean().optional(),
            ...ProposalResearchFields,
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const { custom_tool_id, research, sources, ...changes } = args;
            const current = custom_tool_id ? await grabCustomTool({ custom_tool_id }) : null;
            const data = mergeCustomToolChanges({ current, changes });

            const id = await createExtensionProposal({
                user_id,
                bot_id,
                session_id,
                workspace_id,
                kind: "tool",
                data,
                research,
                sources,
            });

            onPropose?.({ ref: proposalRef({ id }) });

            return describeProposalForBot({ view: await grabExtensionProposalView({ proposal_id: id, user_id }) });
        },
    };
}
