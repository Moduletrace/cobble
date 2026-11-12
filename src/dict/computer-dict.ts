/**
 * A computer is a container of the app's own image (`computer/`: a real
 * headful browser and a shell) on the cobble network, created by the app
 * (`createComputer`), only its workspace (`AppData.ComputerWorkspaceDir`)
 * and browser profile kept under `DATA_DIR`.
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
 * Path of the computer's MCP server (Playwright MCP, driving its browser),
 * on the computer's address.
 */
export const ComputerMcpPath = "/mcp";

/**
 * Playwright MCP tools bots don't get on a computer: closing or resizing
 * the shared browser (every run and the user's live view use it, and its
 * window fills the screen like a real one), its config, and running code
 * in the MCP server itself (computer_bash covers that, inside the run's
 * folders).
 */
export const ComputerMcpExcludedTools = [
    "browser_close",
    "browser_resize",
    "browser_get_config",
    "browser_run_code_unsafe",
] as const;

/**
 * How the user can open a computer, each one served by the computer at
 * `path` (relative to its address), and the only paths the app's proxy
 * passes on (`computerProxyPathAllowed`). Browser is the computer's
 * screen (noVNC over its VNC server): Chrome's whole window, tabs, menu,
 * extensions and prompts, for anyone who reaches the computer. Shell is a
 * terminal as the computer's user, who has sudo and so reads every bot's
 * and user's folder there: `crew_only`, for crew managers
 * (`canManageCrew`).
 */
export const ComputerViewModes = [
    {
        title: "Browser",
        value: "browser",
        path: "desktop/",
        crew_only: false,
    },
    {
        title: "Shell",
        value: "terminal",
        path: "terminal/",
        crew_only: true,
    },
] as const;

export type ComputerViewMode = (typeof ComputerViewModes)[number]["value"];

/**
 * Where the app serves a computer to its owner's browser:
 * `/computers/<id>/<path>`, proxied to the computer (`handleComputerProxy`).
 */
export const ComputerProxyPrefix = "/computers";

/**
 * Screen sizes a computer's browser can have (`browser_settings.screen`):
 * common desktop ones, so the screen gives nothing away. The first is the
 * default.
 */
export const ComputerScreenSizes = ["1920x1080", "1366x768", "1536x864", "1440x900", "1280x800", "1600x900", "2560x1440"] as const;

/**
 * How large a computer's browser draws pages, in percent
 * (`browser_settings.scale`, Chrome's device scale factor): above 100,
 * text is larger in bots' screenshots and the page is laid out narrower
 * (1920x1080 at 125 is 1536x864, the most common laptop).
 */
export const ComputerBrowserScales = ["100", "125", "150", "175", "200"] as const;

/**
 * The scale a computer's browser has when its settings name none; the
 * computer's agent has the same default (`computer/agent/browser-scale.ts`).
 */
export const ComputerDefaultBrowserScale = "125";

/**
 * Chrome flags a computer's settings may not add (`browser_settings
 * .browser_args`): they'd open its DevTools to the network around the
 * token, move its profile, or break the agent's hold on it. The computer's
 * agent drops the same ones (`computer/agent/blocked-args.ts`); keep them
 * alike.
 */
export const ComputerBlockedBrowserArgs = [
    "--remote-debugging-port",
    "--remote-debugging-address",
    "--remote-debugging-pipe",
    "--remote-allow-origins",
    "--user-data-dir",
    "--headless",
] as const;

/**
 * Playwright MCP flags a computer's settings may not add (`mcp_args`):
 * where it listens and what browser it drives are the agent's.
 */
export const ComputerBlockedMcpArgs = [
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
] as const;

/**
 * The `app_settings` key holding how much a computer's workspace may hold,
 * in MB (0 sets no limit).
 */
export const ComputerWorkspaceQuotaSettingKey = "computer_workspace_quota_mb";
