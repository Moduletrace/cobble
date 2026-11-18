import { z } from "zod";

/**
 * Every kind whose access a coordinator run may set (`set_extension_access`):
 * the three extensions `ExtensionKindSchema` names, plus a knowledgebase,
 * which is filled and read by its own tools and only shares this one.
 *
 * Kept apart from `ExtensionKindSchema` on purpose: `delete_extension`
 * picks its delete by kind, and it has no knowledgebase branch (a
 * knowledgebase is deleted by `delete_knowledgebase`, documents included).
 */
export const AccessExtensionKindSchema = z
    .enum(["skill", "mcp", "tool", "knowledgebase"])
    .describe(`"skill" (a runbook), "mcp" (an MCP server), "tool" (a custom tool) or "knowledgebase"`);

export type AccessExtensionKind = z.infer<typeof AccessExtensionKindSchema>;