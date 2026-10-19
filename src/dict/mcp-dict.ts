/**
 * How the app reaches an MCP server. `remote`: over HTTP (Streamable HTTP,
 * SSE fallback). `stdio`: a command the app starts on its own machine (the
 * host in dev, the app's container in production) and talks to over its
 * stdin and stdout.
 */
export const McpTransports = [
    {
        title: "Remote (URL)",
        value: "remote",
    },
    {
        title: "Command on this server (stdio)",
        value: "stdio",
    },
] as const;

export type McpTransport = (typeof McpTransports)[number]["value"];

/**
 * The last time the app listed a server's tools: `ok`, `error` (see its
 * `last_error`), or `untested` before the first time.
 */
export const McpServerStatuses = [
    {
        title: "Untested",
        value: "untested",
    },
    {
        title: "Connected",
        value: "ok",
    },
    {
        title: "Error",
        value: "error",
    },
] as const;

export type McpServerStatus = (typeof McpServerStatuses)[number]["value"];
