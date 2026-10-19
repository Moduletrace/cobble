type Params = {
    /**
     * Which kind: MCP servers or custom tools.
     */
    kind: "mcp" | "tool";
    bot_id: number | string;
    /**
     * The workspace the run is in: what's attached to it counts too.
     */
    workspace_id?: number | string | null;
};

const Tables = {
    mcp: {
        table: "mcp_servers",
        bot_link: "bot_mcp_servers",
        workspace_link: "workspace_mcp_servers",
        column: "mcp_server_id",
    },
    tool: {
        table: "custom_tools",
        bot_link: "bot_custom_tools",
        workspace_link: "workspace_custom_tools",
        column: "custom_tool_id",
    },
} as const;

/**
 * The enabled MCP servers or custom tools a bot gets on one run: those
 * attached to the bot, and in a workspace those attached to the
 * workspace. "Every bot" only decides what a bot is given (now and when
 * it's created, `attachToAllBots`, `attachDefaultExtensions`); one it
 * dropped stays dropped.
 */
export default function botExtensionsSql({ kind, bot_id, workspace_id }: Params) {
    const { table, bot_link, workspace_link, column } = Tables[kind];

    return {
        sql: `SELECT x.* FROM ${table} x WHERE x.enabled = 1 AND (
            x.id IN (SELECT ${column} FROM ${bot_link} WHERE bot_id = ?)
            ${workspace_id ? `OR x.id IN (SELECT ${column} FROM ${workspace_link} WHERE workspace_id = ?)` : ""}
        ) ORDER BY x.id ASC`,
        values: workspace_id ? [Number(bot_id), Number(workspace_id)] : [Number(bot_id)],
    };
}
