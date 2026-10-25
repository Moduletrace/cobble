import { z } from "zod";

/**
 * The three kinds of extension a coordinator tool names: a skill, an MCP
 * server or a custom tool (`ExtensionTables`).
 */
export const ExtensionKindSchema = z
    .enum(["skill", "mcp", "tool"])
    .describe(`"skill" (a runbook), "mcp" (an MCP server) or "tool" (a custom tool)`);
