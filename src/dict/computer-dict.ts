/**
 * A computer is an AIO sandbox running in its own docker container on the
 * cobble network, created by the app (`createComputer`), its home
 * directory kept under `DATA_DIR/computers/<id>`.
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
 * with `running` narrowed by its health check: `starting` until it first
 * passes, `unhealthy` once it keeps failing. Plus `creating` while the app
 * sets it up (until the health check passes), `failed` when that didn't
 * work, and `unknown` for a record that hasn't been inspected yet. Only a
 * `running` computer is reached.
 */
export const ContainerStatuses = [
    {
        title: "Creating",
        value: "creating",
    },
    {
        title: "Failed",
        value: "failed",
    },
    {
        title: "Created",
        value: "created",
    },
    {
        title: "Starting",
        value: "starting",
    },
    {
        title: "Running",
        value: "running",
    },
    {
        title: "Unhealthy",
        value: "unhealthy",
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
 * apps at `path` (relative to the computer's address; `{prefix}` is the
 * computer's app address without its leading slash, e.g. `computers/3/`).
 * Desktop is the whole screen over VNC: the only view with the browser's
 * toolbar (extensions) and a clipboard panel. More of them (opencode,
 * codex) can join later.
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
    {
        title: "Desktop",
        value: "desktop",
        path: "vnc/vnc.html?autoconnect=true&resize=scale&reconnect=true&path={prefix}websockify",
    },
] as const;

export type ComputerViewMode = (typeof ComputerViewModes)[number]["value"];

/**
 * Where the app serves a computer to its owner's browser:
 * `/computers/<id>/<path>`, proxied to the sandbox (`handleComputerProxy`).
 */
export const ComputerProxyPrefix = "/computers";
