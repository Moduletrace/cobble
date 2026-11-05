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
const cwd = "/home/gem/workspace/bots/3/users/7";
const signal = new AbortController().signal;
const call = async (name: string, args: Record<string, unknown>) =>
    JSON.parse((await withComputerDirs({ tool: echoTool(name), dirs }).run({ args, signal })) as string);

describe("withComputerDirs", () => {
    test("uploads resolve paths and refuse outside ones", async () => {
        expect((await call("browser_file_upload", { paths: ["a.pdf", "/home/gem/workspace/workspaces/2/b.png"] })).paths).toEqual([
            `${cwd}/a.pdf`,
            "/home/gem/workspace/workspaces/2/b.png",
        ]);
        await expect(call("browser_file_upload", { paths: ["/home/gem/.bashrc"] })).rejects.toThrow();
        await expect(call("browser_file_upload", { paths: ["../../../4/x"] })).rejects.toThrow();
    });

    test("file URLs must be in the run's folders, web ones pass", async () => {
        expect((await call("browser_navigate", { url: "https://example.com" })).url).toBe("https://example.com");
        expect((await call("browser_navigate", { url: `file://${cwd}/a.html` })).url).toBe(`file://${cwd}/a.html`);
        await expect(call("browser_navigate", { url: "file:///etc/passwd" })).rejects.toThrow();
        await expect(call("browser_tabs", { action: "new", url: "file:///home/gem/.config/x" })).rejects.toThrow();
    });

    test("drops read their paths from the run's folders too", async () => {
        expect((await call("browser_drop", { paths: ["a.png"] })).paths).toEqual([`${cwd}/a.png`]);
        await expect(call("browser_drop", { paths: ["/etc/hosts"] })).rejects.toThrow();
    });

    test("a file saved by name lands in the run's folders", async () => {
        expect((await call("browser_take_screenshot", { filename: "shot.png" })).filename).toBe(`${cwd}/shot.png`);
        expect((await call("browser_snapshot", { filename: "/home/gem/workspace/workspaces/2/page.md" })).filename).toBe(
            "/home/gem/workspace/workspaces/2/page.md",
        );
        await expect(call("browser_console_messages", { filename: "/home/gem/workspace/bots/4/log.txt" })).rejects.toThrow();
    });

    test("passes other arguments through", async () => {
        expect(await call("browser_click", { ref: "e4", element: "Sign in" })).toEqual({ ref: "e4", element: "Sign in" });
        expect(await call("browser_take_screenshot", { filename: " " })).toEqual({ filename: " " });
    });
});

describe("computerDirsShell", () => {
    test("creates the folders and moves in", () => {
        expect(computerDirsShell({ dirs })).toBe(
            `mkdir -p '${cwd}' '/home/gem/workspace/workspaces/2' && cd '${cwd}' && export HOME='${cwd}'; `,
        );
    });
});
