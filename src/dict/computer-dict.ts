/**
 * A computer is an AIO sandbox running in its own docker container on the
 * cobble network. The main computer is set up at install and recorded on
 * signup; sandboxes are created later by the main container.
 */
export const ComputerKinds = [
    {
        title: "Main",
        value: "main",
    },
    {
        title: "Sandbox",
        value: "sandbox",
    },
] as const;

export type ComputerKind = (typeof ComputerKinds)[number]["value"];

export const MainComputerName = "Main computer";

/**
 * Docker container state as reported by `docker inspect` (`State.Status`),
 * plus `unknown` for a record that hasn't been inspected yet.
 */
export const ContainerStatuses = [
    {
        title: "Created",
        value: "created",
    },
    {
        title: "Running",
        value: "running",
    },
    {
        title: "Paused",
        value: "paused",
    },
    {
        title: "Restarting",
        value: "restarting",
    },
    {
        title: "Exited",
        value: "exited",
    },
    {
        title: "Removing",
        value: "removing",
    },
    {
        title: "Dead",
        value: "dead",
    },
    {
        title: "Unknown",
        value: "unknown",
    },
] as const;

export type ContainerStatus = (typeof ContainerStatuses)[number]["value"];

/**
 * What a recorded container is for. The main app container is never recorded.
 */
export const ContainerPurposes = [
    {
        title: "Computer",
        value: "computer",
    },
] as const;

export type ContainerPurpose = (typeof ContainerPurposes)[number]["value"];

/**
 * Path of the AIO sandbox's MCP endpoint, on the computer's address.
 */
export const ComputerMcpPath = "/mcp";

/**
 * Sandbox MCP tools bots don't get: noise (cdp urls), skills they have no
 * use for, and raw display control that needs pixel coordinates (the page
 * tools cover the same ground by element).
 */
export const ComputerMcpExcludedTools = [
    "browser_get_info",
    "sandbox_load_skill",
    "browser_gui_screenshot",
    "browser_gui_execute_action",
] as const;

/**
 * How the user can open a computer, each one of the AIO sandbox's own
 * apps at `path` (relative to the computer's address). More of them
 * (VNC, opencode, codex) can join later.
 */
export const ComputerViewModes = [
    {
        title: "Browser",
        value: "browser",
        path: "browser-ui",
    },
    {
        title: "Terminal",
        value: "terminal",
        path: "terminal",
    },
    {
        title: "Code",
        value: "code",
        path: "code-server/",
    },
] as const;

export type ComputerViewMode = (typeof ComputerViewModes)[number]["value"];

/**
 * Where the app serves a computer to its owner's browser:
 * `/computers/<id>/<path>`, proxied to the sandbox (`handleComputerProxy`).
 */
export const ComputerProxyPrefix = "/computers";
