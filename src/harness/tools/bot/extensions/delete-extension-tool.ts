import { z } from "zod";
import deleteCustomTool from "@/src/functions/backend/db/extensions/delete-custom-tool";
import deleteMcpServer from "@/src/functions/backend/db/extensions/delete-mcp-server";
import deleteSkill from "@/src/functions/backend/db/extensions/delete-skill";
import { ExtensionTables, type ExtensionKind } from "@/src/functions/backend/db/extensions/extension-tables";
import logEvent from "@/src/functions/backend/logger";
import type { HarnessTool } from "../../../types";
import assertSuperAdminRun from "./assert-super-admin-run";
import { ExtensionKindSchema } from "./extension-kind-schema";

type Params = {
    user_id: number | string;
};

type Args = {
    kind: ExtensionKind;
    id: number;
};

/**
 * Lets the coordinator delete a skill, MCP server or custom tool. Every
 * bot and workspace loses it at once, so it only runs when the user asked
 * for that exact one to go.
 */
export default function deleteExtensionTool({ user_id }: Params): HarnessTool<Args> {
    return {
        name: "delete_extension",
        description: `Delete a skill, MCP server or custom tool by kind and id (list_extensions shows them). Every bot and workspace loses it at once and it can't be undone (an MCP server's install folder stays). Only do it when the user explicitly asked for this exact one to go; to take it from some bots use set_extension_access, to pause it save it with enabled false.`,
        schema: z.object({
            kind: ExtensionKindSchema,
            id: z.number().int().positive(),
        }),
        run: async ({ args }) => {
            await assertSuperAdminRun({ user_id });

            const deleted =
                args.kind == "skill"
                    ? await deleteSkill({ skill_id: args.id })
                    : args.kind == "mcp"
                      ? await deleteMcpServer({ mcp_server_id: args.id })
                      : await deleteCustomTool({ custom_tool_id: args.id });

            const { label } = ExtensionTables[args.kind];

            await logEvent({
                title: `${label.charAt(0).toUpperCase()}${label.slice(1)} deleted`,
                category: "system",
                user_id: Number(user_id),
                plain_text: `The coordinator deleted the ${label} ${deleted.name} (#${deleted.id}).`,
                metadata: { kind: args.kind, id: deleted.id },
            });

            return `The ${label} ${deleted.name} (#${deleted.id}) is deleted. No bot or workspace has it any more.`;
        },
    };
}
