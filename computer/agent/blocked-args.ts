/**
 * Flags the computer's own settings may not pass to Chrome
 * (`COBBLE_BROWSER_ARGS`): they'd open its DevTools to the network (around
 * the token), move its profile, or break the agent's hold on it. The app
 * refuses the same ones (`ComputerBlockedBrowserArgs`); keep them alike.
 */
export const BrowserBlockedArgs = [
    "--remote-debugging-port",
    "--remote-debugging-address",
    "--remote-debugging-pipe",
    "--remote-allow-origins",
    "--user-data-dir",
    "--headless",
];

/**
 * Flags the computer's own settings may not pass to Playwright MCP
 * (`COBBLE_MCP_ARGS`): where it listens and what it drives are the
 * agent's, so it stays on loopback behind the token, on this browser.
 * The app refuses the same ones (`ComputerBlockedMcpArgs`).
 */
export const McpBlockedArgs = [
    "--host",
    "--port",
    "--allowed-hosts",
    "--allowed-origins",
    "--cdp-endpoint",
    "--cdp-header",
    "--extension",
    "--config",
    "--browser",
    "--executable-path",
    "--user-data-dir",
    "--isolated",
    "--shared-browser-context",
    "--output-dir",
    "--file-paths",
];
