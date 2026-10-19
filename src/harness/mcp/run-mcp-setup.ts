import { readdir, rm, writeFile } from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import type { McpServerRecord } from "@/src/types";
import grabMcpDir from "./grab-mcp-dir";
import hostShell from "./host-shell";

type Params = {
    server: McpServerRecord;
    /**
     * Its environment (`grabMcpStdioEnv`).
     */
    env: Record<string, string>;
    /**
     * Runs it even when this setup already ran.
     */
    force?: boolean;
};

const MarkerPrefix = ".cobble-setup-";

/**
 * Runs a stdio MCP server's setup command with the host's shell in its
 * directory, once per setup command: a marker file named after it is left
 * behind, so it runs again when the command changes, when `force` is set,
 * or when the directory was cleared. The output goes to `setup.log`; a
 * failure throws with its last lines.
 */
export default async function runMcpSetup({ server, env, force }: Params) {
    const command = server.setup_command.trim();

    if (!command) return;

    const dir = await grabMcpDir({ server_id: server.id });
    const marker = `${MarkerPrefix}${Bun.hash(command).toString(36)}`;
    const existing = (await readdir(dir)).filter((file) => file.startsWith(MarkerPrefix));

    if (!force && existing.includes(marker)) return;

    await Promise.all(existing.map((file) => rm(path.join(dir, file), { force: true })));

    const proc = Bun.spawn([hostShell(), "-c", command], {
        cwd: dir,
        env,
        stdout: "pipe",
        stderr: "pipe",
        timeout: AppData.McpSetupTimeoutMs,
    });

    const [stdout, stderr, exit_code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);
    const output = `${stdout}${stderr ? `\n${stderr}` : ""}`.trim();

    await writeFile(path.join(dir, "setup.log"), `$ ${command}\n${output}\nExit code: ${exit_code}\n`);

    if (exit_code !== 0) {
        throw new Error(`The setup command failed (exit code ${exit_code}): ${output.slice(-2000) || "no output"}`);
    }

    await writeFile(path.join(dir, marker), command);
}
