import { describe, expect, test } from "bun:test";
import computerRunDirs from "@/src/utils/computer-work-dirs";
import type { HarnessTool } from "../../types";
import computerDirsShell from "./computer-dirs-shell";
import withComputerDirs from "./with-computer-dirs";

const echoTool = (name: string): HarnessTool => ({
    name,
    description: "",
    parameters: {},
    run: async ({ args }) => JSON.stringify(args),
});

const dirs = computerRunDirs({ bot_id: 3, user_id: 7, workspace_id: 2 });
const cwd = "/home/cb-3/workspace/users/7";
const shared = "/home/cb-3/workspace/workspaces/2";
const signal = new AbortController().signal;
const call = async (name: string, args: Record<string, unknown>) =>
    JSON.parse((await withComputerDirs({ tool: echoTool(name), dirs }).run({ args, signal })) as string);

describe("withComputerDirs", () => {
    test("uploads resolve paths and refuse outside ones", async () => {
        expect((await call("browser_file_upload", { paths: ["a.pdf", `${shared}/b.png`, "/home/gem/workspace/workspaces/2/c.png"] })).paths).toEqual([
            `${cwd}/a.pdf`,
            `${shared}/b.png`,
            `${shared}/c.png`,
        ]);
        await expect(call("browser_file_upload", { paths: ["/home/gem/.bashrc"] })).rejects.toThrow();
        await expect(call("browser_file_upload", { paths: ["../../../4/x"] })).rejects.toThrow();
    });

    test("a worker opens no file URLs, web ones pass", async () => {
        expect((await call("browser_navigate", { url: "https://example.com" })).url).toBe("https://example.com");
        await expect(call("browser_navigate", { url: `file://${cwd}/a.html` })).rejects.toThrow("Serve the folder instead");
        await expect(call("browser_navigate", { url: "file:///etc/passwd" })).rejects.toThrow();
        await expect(call("browser_tabs", { action: "new", url: "FILE:///home/gem/.config/x" })).rejects.toThrow();
    });

    test("the coordinator's file URLs must be in its folders", async () => {
        const coordinator = computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 7 });
        const open = async (url: string) =>
            JSON.parse((await withComputerDirs({ tool: echoTool("browser_navigate"), dirs: coordinator }).run({ args: { url }, signal })) as string);

        expect((await open("file:///home/gem/workspace/bots/3/a.html")).url).toBe("file:///home/gem/workspace/bots/3/a.html");
        await expect(open("file:///etc/passwd")).rejects.toThrow();
    });

    test("drops read their paths from the run's folders too", async () => {
        expect((await call("browser_drop", { paths: ["a.png"] })).paths).toEqual([`${cwd}/a.png`]);
        await expect(call("browser_drop", { paths: ["/etc/hosts"] })).rejects.toThrow();
    });

    test("a file saved by name lands in the run's folders", async () => {
        expect((await call("browser_take_screenshot", { filename: "shot.png" })).filename).toBe(`${cwd}/shot.png`);
        expect((await call("browser_snapshot", { filename: `${shared}/page.md` })).filename).toBe(`${shared}/page.md`);
        await expect(call("browser_console_messages", { filename: "/home/gem/workspace/bots/4/log.txt" })).rejects.toThrow();
    });

    test("passes other arguments through", async () => {
        expect(await call("browser_click", { ref: "e4", element: "Sign in" })).toEqual({ ref: "e4", element: "Sign in" });
        expect(await call("browser_take_screenshot", { filename: " " })).toEqual({ filename: " " });
    });
});

const workerCaches = `XDG_CACHE_HOME='/home/cb-3/.cache' npm_config_cache='/home/cb-3/.cache/npm' PIP_CACHE_DIR='/home/cb-3/.cache/pip' BUN_INSTALL_CACHE_DIR='/home/cb-3/.cache/bun' PYTHONPYCACHEPREFIX='/home/cb-3/.cache/pycache'`;
const coordinatorCaches = `XDG_CACHE_HOME='/home/gem/.cache' npm_config_cache='/home/gem/.cache/npm' PIP_CACHE_DIR='/home/gem/.cache/pip' BUN_INSTALL_CACHE_DIR='/home/gem/.cache/bun' PYTHONPYCACHEPREFIX='/home/gem/.cache/pycache'`;

describe("computerDirsShell", () => {
    test("a worker's: its umask, the shared link put back, its folder, moved in, installs into its home", () => {
        expect(computerDirsShell({ dirs })).toBe(
            `umask 007 && { [ -e '${shared}' ] || [ -L '${shared}' ] || { mkdir -p '/home/cb-3/workspace/workspaces' && ln -s '/home/gem/workspace/workspaces/2' '${shared}'; }; } && mkdir -p '${cwd}' '/home/cb-3/.cache' && cd '${cwd}' && export HOME='${cwd}' ${workerCaches} && export PATH="$HOME/.local/bin:$PATH" NPM_CONFIG_PREFIX="$HOME/.local"; `,
        );
    });

    test("a worker outside a workspace: no shared link", () => {
        expect(computerDirsShell({ dirs: computerRunDirs({ bot_id: 3, user_id: 7 }) })).toBe(
            `umask 007 && mkdir -p '${cwd}' '/home/cb-3/.cache' && cd '${cwd}' && export HOME='${cwd}' ${workerCaches} && export PATH="$HOME/.local/bin:$PATH" NPM_CONFIG_PREFIX="$HOME/.local"; `,
        );
    });

    test("the coordinator's: the folders and moved in", () => {
        const coordinator = computerRunDirs({ bot_id: 1, bot_kind: "coordinator", user_id: 7 });

        expect(computerDirsShell({ dirs: coordinator })).toBe(
            `mkdir -p '/home/gem/workspace/bots/1/users/7' '/home/gem/.cache' && cd '/home/gem/workspace/bots/1/users/7' && export HOME='/home/gem/workspace/bots/1/users/7' ${coordinatorCaches}; `,
        );
    });

    test("a run's caches go to the account's own home, never into its folder", () => {
        const shell = computerDirsShell({ dirs: computerRunDirs({ bot_id: 3, user_id: 7 }) });

        expect(shell).toContain("XDG_CACHE_HOME='/home/cb-3/.cache'");
        expect(shell).not.toContain(`XDG_CACHE_HOME='${cwd}'`);
        expect(shell).not.toContain(`PIP_CACHE_DIR='${cwd}'`);
    });
});
