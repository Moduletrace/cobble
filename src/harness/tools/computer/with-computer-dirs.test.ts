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
    JSON.parse(await withComputerDirs({ tool: echoTool(name), dirs }).run({ args, signal }));

describe("withComputerDirs", () => {
    test("bash runs in the user's folder with it as HOME", async () => {
        const sent = await call("sandbox_execute_bash", { cmd: "ls" });

        expect(sent.cwd).toBe(cwd);
        expect(sent.cmd).toBe(`export HOME="${cwd}"; ls`);
    });

    test("bash keeps a cwd inside the run's folders and refuses one outside", async () => {
        expect((await call("sandbox_execute_bash", { cmd: "ls", cwd: "seo" })).cwd).toBe(`${cwd}/seo`);
        await expect(call("sandbox_execute_bash", { cmd: "ls", cwd: "/etc" })).rejects.toThrow();
    });

    test("code starts in the user's folder", async () => {
        const python = await call("sandbox_execute_code", { code: "print(1)", language: "python" });
        const js = await call("sandbox_execute_code", { code: "1", language: "javascript" });

        expect(python.code).toContain(`_cobble_os.chdir("${cwd}")`);
        expect(python.code).toEndWith("\nprint(1)");
        expect(js.code).toContain(`process.chdir("${cwd}")`);
    });

    test("file tools resolve paths and refuse outside ones and sudo", async () => {
        expect((await call("sandbox_file_operations", { action: "read", path: "a.txt" })).path).toBe(`${cwd}/a.txt`);
        expect((await call("sandbox_str_replace_editor", { command: "view", path: "/home/gem/workspace/workspaces/2/x" })).path).toBe(
            "/home/gem/workspace/workspaces/2/x",
        );
        await expect(call("sandbox_file_operations", { action: "read", path: "/home/gem/.bashrc" })).rejects.toThrow();
        await expect(call("sandbox_file_operations", { action: "list", path: "a", sudo: true })).rejects.toThrow();
        await expect(call("sandbox_str_replace_editor", { command: "view", path: "../../../4/x" })).rejects.toThrow();
    });

    test("file URLs must be in the run's folders, web ones pass", async () => {
        expect((await call("browser_navigate", { url: "https://example.com" })).url).toBe("https://example.com");
        expect((await call("browser_navigate", { url: `file://${cwd}/a.html` })).url).toBe(`file://${cwd}/a.html`);
        await expect(call("browser_navigate", { url: "file:///etc/passwd" })).rejects.toThrow();
        await expect(call("sandbox_convert_to_markdown", { uri: "file:///home/gem/.config/x" })).rejects.toThrow();
    });

    test("leaves other tools alone", () => {
        const tool = echoTool("browser_click");
        expect(withComputerDirs({ tool, dirs })).toBe(tool);
    });
});

describe("computerDirsShell", () => {
    test("creates the folders and moves in", () => {
        expect(computerDirsShell({ dirs })).toBe(
            `mkdir -p '${cwd}' '/home/gem/workspace/workspaces/2' && cd '${cwd}' && export HOME='${cwd}'; `,
        );
    });
});
