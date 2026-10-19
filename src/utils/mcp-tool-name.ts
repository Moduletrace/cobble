type Params = {
    /**
     * The server's slug (`mcp_servers.slug`).
     */
    slug: string;
    /**
     * The tool's name on the server.
     */
    name: string;
};

/**
 * What a bot calls an MCP server's tool: `<slug>__<tool>`, only letters,
 * numbers, `_` and `-`, at most 64 characters (what providers accept).
 */
export default function mcpToolName({ slug, name }: Params) {
    return `${slug}__${name.replace(/[^A-Za-z0-9_-]/g, "_")}`.slice(0, 64);
}
