/**
 * Where each kind of extension lives: its table, and the link tables
 * that attach it to bots and workspaces.
 */
export const ExtensionTables = {
    mcp: {
        table: "mcp_servers",
        bot_link: "bot_mcp_servers",
        workspace_link: "workspace_mcp_servers",
        column: "mcp_server_id",
        label: "MCP server",
    },
    tool: {
        table: "custom_tools",
        bot_link: "bot_custom_tools",
        workspace_link: "workspace_custom_tools",
        column: "custom_tool_id",
        label: "tool",
    },
} as const;

export type ExtensionKind = keyof typeof ExtensionTables;
