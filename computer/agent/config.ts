import { BrowserBlockedArgs, McpBlockedArgs } from "./blocked-args";
import safeExtraArgs from "./safe-extra-args";
import browserScale from "./browser-scale";
import parkAfterMs from "./park-after-ms";
import screenSize from "./screen-size";

const env = process.env;

/**
 * Everything the computer's agent is set up with. The user, home and
 * folders match what the app mounts (`AppData.ComputerHomeDir`,
 * `ComputerWorkspaceDir`, `ComputerBrowserProfileDir`).
 */
export const AgentConfig = {
    /**
     * The one port the app reaches: the API, `/mcp`, the screen and the
     * shell.
     */
    Port: Number(env.COBBLE_AGENT_PORT || 8080),
    /**
     * Sent by the app as `Authorization: Bearer <token>`. Without one set,
     * every request is let in (a computer run by hand for development).
     */
    Token: env.COBBLE_COMPUTER_TOKEN || "",
    /**
     * The computer's own user, with passwordless sudo: the services run as
     * it, and so do the coordinator's commands. Worker bots get accounts of
     * their own (`runUserFor`).
     */
    User: "gem",
    Uid: 1000,
    Gid: 1000,
    Home: "/home/gem",
    /**
     * A worker bot's account is `cb-<bot id>`, uid and gid
     * `WorkerIdBase + bot id`, without sudo; a workspace's group is
     * `cw-<id>`, gid `WorkspaceGroupBase + id`. Ids above `MaxRunId` are
     * refused, so the ranges never meet. Keep alike the app's
     * `computerWorkerAccount`.
     */
    WorkerIdBase: 100_000,
    WorkspaceGroupBase: 10_000_000,
    MaxRunId: 9_000_000,
    /**
     * The X display's cookie (gem's alone): without it nothing reaches the
     * screen, so a worker can't watch or type into Chrome.
     */
    XAuthority: "/run/cobble/xauth",
    WorkspaceDir: "/home/gem/workspace",
    ProfileDir: env.COBBLE_BROWSER_PROFILE_DIR || "/home/gem/.cobble-browser",
    /**
     * The browser's pid and environment (`browser.pid`, `browser.json`),
     * the session bus and the runtime dir, for what runs beside it (the
     * notification watcher).
     */
    RunDir: "/run/cobble",
    Display: ":99",
    Screen: screenSize({ text: env.COBBLE_SCREEN }),
    /**
     * How large Chrome draws pages (its device scale factor): above 1, text
     * is larger in screenshots and pages are laid out narrower.
     */
    Scale: browserScale({ text: env.COBBLE_BROWSER_SCALE }),
    Lang: env.COBBLE_BROWSER_LANG || "en-US",
    AcceptLang: env.COBBLE_BROWSER_ACCEPT_LANG || env.COBBLE_BROWSER_LANG || "en-US,en",
    /**
     * `false` turns Chrome's sandbox off from the start. It's also turned
     * off by itself when Chrome says the host gives it none.
     */
    BrowserSandbox: (env.COBBLE_BROWSER_SANDBOX || "true").toLowerCase() != "false",
    /**
     * More Chrome flags, space separated.
     */
    BrowserExtraArgs: safeExtraArgs({ text: env.COBBLE_BROWSER_ARGS, blocked: BrowserBlockedArgs }),
    /**
     * Without a browser tool call or a screen view for this long, the
     * sites on show are sent behind a blank tab so their animations stop
     * costing CPU (`createBrowserParking`); 0 never does.
     */
    BrowserParkAfterMs: parkAfterMs({ text: env.COBBLE_BROWSER_PARK_AFTER_SECONDS }),
    /**
     * Chrome's DevTools port, on loopback only: Playwright MCP reaches it
     * from inside the container.
     */
    CdpPort: 9222,
    McpPort: 8931,
    McpCli: "/opt/playwright-mcp/node_modules/@playwright/mcp/cli.js",
    /**
     * More Playwright MCP flags, space separated (e.g. `--caps vision`),
     * without the ones that would move it off loopback or this browser.
     */
    McpExtraArgs: safeExtraArgs({ text: env.COBBLE_MCP_ARGS, blocked: McpBlockedArgs }),
    /**
     * The shell's web terminal (ttyd), on loopback, served under
     * `/terminal/` behind the token.
     */
    TerminalPort: 7681,
    /**
     * Where Playwright MCP writes snapshots, console logs and downloads
     * (the app's `AppData.ComputerBrowserOutputDir`), oldest evicted past
     * the size.
     */
    McpOutputDir: "/home/gem/.cobble/playwright",
    McpOutputMaxBytes: 256 * 1024 * 1024,
    /**
     * The screen's VNC server (Xvnc), on loopback, reached through the
     * agent's own websocket bridge at `/desktop/websockify`.
     */
    VncPort: 5900,
    /**
     * noVNC, the screen's viewer, served at `/desktop/`.
     */
    NoVncDir: env.COBBLE_NOVNC_DIR || "/opt/novnc",
    /**
     * A command's timeout when it names none, and the most it may ask for.
     */
    CommandDefaultSeconds: 270,
    CommandMaxSeconds: 3600,
    /**
     * Output past this is dropped (and the response says so).
     */
    CommandMaxOutputBytes: 4 * 1024 * 1024,
    /**
     * How long children get to exit on a stop before they're killed.
     */
    StopGraceMs: 8000,
};
