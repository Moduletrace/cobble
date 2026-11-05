import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { AgentState } from "./agent-state";
import browserArgs from "./browser-args";
import clearProfileLocks from "./clear-profile-locks";
import type { BrowserParking } from "./create-browser-parking";
import { AgentConfig } from "./config";
import findBrowserBinary from "./find-browser-binary";
import isPortAnswering from "./is-port-answering";
import log from "./log";
import superviseProcess, { type Supervised } from "./supervise-process";
import userEnv from "./user-env";
import waitUntil from "./wait-until";

/**
 * Says the host gives Chrome no sandbox (user namespaces blocked).
 */
const NoSandboxPattern = /no usable sandbox|setuid sandbox|user namespaces|clone\(\) failed/i;

/**
 * Starts and keeps running, as the computer's user: the virtual screen
 * (Xvnc, an X server that is also a VNC server on loopback, so the screen
 * view shows Chrome's whole window), the session bus (where the notification watcher meets Chrome),
 * Chrome, Playwright MCP once Chrome's DevTools port answers, and the web
 * terminal (ttyd, a login shell in the workspace). Each one comes back
 * when it exits (a new Chrome tells `parking` its old tabs are gone).
 * Returns them in the order they stop.
 */
export default async function startServices({ parking }: { parking: BrowserParking }): Promise<Supervised[]> {
    const { Uid: uid, Gid: gid, RunDir, Screen } = AgentConfig;
    const binary = findBrowserBinary();

    AgentState.browser_binary = binary;
    AgentState.browser_version = readVersion({ binary });
    AgentState.browser_sandbox = AgentConfig.BrowserSandbox;

    log({ name: "agent", message: `${AgentState.browser_version} at ${binary}` });

    const display = superviseProcess({
        name: "display",
        command: "Xvnc",
        args: () => [
            AgentConfig.Display,
            "-geometry",
            `${Screen.width}x${Screen.height}`,
            "-depth",
            "24",
            "-dpi",
            "96",
            "-nolisten",
            "tcp",
            "-desktop",
            "Computer",
            // VNC on loopback only, without a password: the agent's token
            // guards the one way in (`/desktop/websockify`).
            "-localhost",
            "-interface",
            "127.0.0.1",
            "-rfbport",
            String(AgentConfig.VncPort),
            "-SecurityTypes",
            "None",
            "-AlwaysShared",
            // The screen size is a setting (and what sites see); a viewer
            // only scales it.
            "-AcceptSetDesktopSize=0",
        ],
        env: () => userEnv(),
        uid,
        gid,
    });

    const bus = superviseProcess({
        name: "bus",
        command: "dbus-daemon",
        args: () => ["--session", "--nofork", "--nopidfile", `--address=unix:path=${RunDir}/bus`],
        env: () => userEnv(),
        uid,
        gid,
    });

    await waitUntil({ check: async () => Boolean(display.pid()), every_ms: 100 });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const browser = superviseProcess({
        name: "browser",
        command: binary,
        args: () => {
            clearProfileLocks({ profile_dir: AgentConfig.ProfileDir });

            return browserArgs({
                profile_dir: AgentConfig.ProfileDir,
                cdp_port: AgentConfig.CdpPort,
                screen: Screen,
                scale: AgentConfig.Scale,
                lang: AgentConfig.Lang,
                accept_lang: AgentConfig.AcceptLang,
                sandbox: AgentState.browser_sandbox,
                extra: AgentConfig.BrowserExtraArgs,
            });
        },
        env: () => userEnv(),
        cwd: AgentConfig.Home,
        uid,
        gid,
        onStart: ({ pid }) => {
            parking.browserRestarted();
            writeBrowserState({ pid });
        },
        onExit: ({ uptime_ms, tail }) => {
            if (AgentState.browser_sandbox && uptime_ms < 20_000 && NoSandboxPattern.test(tail)) {
                AgentState.browser_sandbox = false;
                log({ name: "browser", message: `the host gives Chrome no sandbox; running it without one. ${tail.slice(-300)}` });
            }
        },
    });

    await waitUntil({
        check: () => isPortAnswering({ url: `http://127.0.0.1:${AgentConfig.CdpPort}/json/version` }),
        every_ms: 500,
    });

    log({ name: "browser", message: `DevTools answers on ${AgentConfig.CdpPort}` });

    const mcp = superviseProcess({
        name: "mcp",
        command: process.execPath,
        args: () => [
            AgentConfig.McpCli,
            "--cdp-endpoint",
            `http://127.0.0.1:${AgentConfig.CdpPort}`,
            "--host",
            "127.0.0.1",
            "--port",
            String(AgentConfig.McpPort),
            "--shared-browser-context",
            "--ignore-roots",
            "--allow-unrestricted-file-access",
            "--codegen",
            "none",
            "--no-webmcp",
            // Snapshots, console logs and downloads it writes to files: the
            // app moves downloads into the run's folders and points the
            // model at the tools that read the rest, so the paths are
            // absolute and the folder is kept small.
            "--output-dir",
            AgentConfig.McpOutputDir,
            "--output-max-size",
            String(AgentConfig.McpOutputMaxBytes),
            "--file-paths",
            "absolute",
            ...AgentConfig.McpExtraArgs,
        ],
        env: () => userEnv(),
        cwd: AgentConfig.WorkspaceDir,
        uid,
        gid,
    });

    const terminal = superviseProcess({
        name: "terminal",
        command: "ttyd",
        args: () => [
            "--interface",
            "127.0.0.1",
            "--port",
            String(AgentConfig.TerminalPort),
            "--base-path",
            "/terminal",
            "--writable",
            "--cwd",
            AgentConfig.WorkspaceDir,
            "--client-option",
            "titleFixed=Shell",
            "--client-option",
            "disableLeaveAlert=true",
            "bash",
            "--login",
        ],
        env: () => ({ ...userEnv(), TERM: "xterm-256color" }),
        cwd: AgentConfig.WorkspaceDir,
        uid,
        gid,
    });

    return [terminal, mcp, browser, bus, display];
}

/**
 * The browser's version line, e.g. `Google Chrome 142.0.7444.59`.
 */
function readVersion({ binary }: { binary: string }) {
    try {
        return execFileSync(binary, ["--version"], { encoding: "utf8", timeout: 10_000 }).trim();
    } catch {
        return "";
    }
}

/**
 * Where the browser runs and with what, for what runs beside it (the
 * notification watcher restarts Chrome by its pid, and reads when it
 * started from the pid file's time).
 */
function writeBrowserState({ pid }: { pid: number }) {
    const env = userEnv();

    writeFileSync(`${AgentConfig.RunDir}/browser.pid`, `${pid}\n`, { mode: 0o644 });
    writeFileSync(
        `${AgentConfig.RunDir}/browser.json`,
        `${JSON.stringify({
            browser: {
                pid,
                binary: AgentState.browser_binary,
                env: {
                    DISPLAY: env.DISPLAY,
                    DBUS_SESSION_BUS_ADDRESS: env.DBUS_SESSION_BUS_ADDRESS,
                    XDG_RUNTIME_DIR: env.XDG_RUNTIME_DIR,
                },
            },
        })}\n`,
        { mode: 0o644 },
    );
}
