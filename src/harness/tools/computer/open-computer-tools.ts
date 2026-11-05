import { AppData } from "@/src/data/app-data";
import { ComputerMcpExcludedTools } from "@/src/dict/computer-dict";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import writeComputerEnv from "@/src/functions/backend/computers/write-computer-env";
import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import grabComputerEnvs from "@/src/functions/backend/db/envs/grab-computer-envs";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import redactSecrets from "@/src/utils/redact-secrets";
import connectMcpServer from "../../mcp/connect-mcp-server";
import grabMcpTools from "../../mcp/grab-mcp-tools";
import type { HarnessTool } from "../../types";
import captureSecretTool from "./capture-secret-tool";
import computerBashTool from "./computer-bash-tool";
import computerDirsShell from "./computer-dirs-shell";
import computerEditFileTool from "./computer-edit-file-tool";
import computerReadFileTool from "./computer-read-file-tool";
import type { ComputerToolContext } from "./computer-tool-context";
import computerWriteFileTool from "./computer-write-file-tool";
import withBrowserOutputs from "./with-browser-outputs";
import withComputerDirs from "./with-computer-dirs";

type Params = {
    computer_id: number | string;
    /**
     * Screenshots are read with this bot's media reading model.
     */
    bot_id?: number | string;
    /**
     * The user the run is for: their personal envs for the bot apply.
     */
    user_id?: number | string | null;
    /**
     * The workspace the run is in: its envs apply, and its models read
     * screenshots.
     */
    workspace_id?: number | string | null;
    /**
     * The run's folders on the computer (`computerRunDirs`): every tool is
     * kept inside them.
     */
    dirs: ComputerRunDirs;
    /**
     * Called with the ref of each secret the bot captures on the computer
     * (`capture_secret`), so the run's message always carries its chip.
     * Without it, or without a user, the bot can't capture secrets.
     */
    onSecretRef?: (params: { ref: string }) => void;
    signal?: AbortSignal;
};

export type OpenComputer = {
    name: string;
    tools: HarnessTool[];
    /**
     * The envs set on the computer, for the prompt: keys and descriptions,
     * never values.
     */
    envs: { key: string; description: string }[];
    /**
     * Blanks the computer's secret values out of text, e.g. the report.
     */
    redact: (text: string) => string;
    close: () => Promise<void>;
};

/**
 * Connects to a computer and returns its tools: its shell and files (the
 * app's own `computer_*` tools, over the computer's agent) and its browser
 * (Playwright MCP on the computer, attached to its real Chrome). Its envs
 * (`grabComputerEnvs`) are written to the computer and loaded by the
 * shell; secret values are redacted from everything the tools return.
 * Every tool is kept in the run's folders (`withComputerDirs`, and the
 * shell and file tools themselves), which are created first. Screenshots
 * come back as images for the run. Call `close` when the run ends. Throws
 * when the computer can't be reached, which the queue retries.
 */
export default async function openComputerTools({
    computer_id,
    bot_id,
    user_id,
    workspace_id,
    dirs,
    onSecretRef,
    signal,
}: Params): Promise<OpenComputer> {
    const target = await grabComputerMcpUrl({ computer_id });

    if (!target) {
        throw new Error(`Computer #${computer_id} has no container to connect to.`);
    }

    if (!target.ready) {
        throw new Error(computerNotReadyMessage(target));
    }

    const envs = await grabComputerEnvs({ computer_id, bot_id, user_id, workspace_id });
    const paths = await writeComputerEnv({ computer: target, envs, signal });

    await runComputerCommand({
        computer: target,
        command: `${computerDirsShell({ dirs })}true`,
        timeout_ms: AppData.McpConnectTimeoutMs,
        signal,
    });

    /**
     * Grows as the bot captures secrets, so a value it saved is blanked
     * from everything it reads afterwards too.
     */
    const secrets: { key: string; value: string }[] = envs.filter((env) => env.secret);
    const redact = (text: string) => redactSecrets({ text, secrets });

    const client = await connectMcpServer({ url: target.url, headers: { authorization: `Bearer ${target.token}` }, signal });
    const context: ComputerToolContext = { computer: target, dirs, shell_path: paths.shell_path, redact };

    try {
        const browser_tools = await grabMcpTools({
            client,
            exclude: ComputerMcpExcludedTools,
            redact,
            image_focus: "This is a screenshot of a web page. Describe the page layout, text, buttons and form fields, and any errors or popups.",
        });

        return {
            name: target.name,
            tools: [
                computerBashTool(context),
                computerReadFileTool(context),
                computerWriteFileTool(context),
                computerEditFileTool(context),
                ...browser_tools.map((tool) => withBrowserOutputs({ tool: withComputerDirs({ tool, dirs }), computer: target, dirs })),
                ...(user_id && bot_id && onSecretRef
                    ? [
                          captureSecretTool({
                              computer: target,
                              shell_path: paths.shell_path,
                              dirs,
                              user_id,
                              bot_id,
                              onCapture: ({ key, value, ref }) => {
                                  secrets.push({ key, value });
                                  onSecretRef({ ref });
                              },
                          }),
                      ]
                    : []),
            ],
            envs: envs.map((env) => ({ key: env.key, description: env.description })),
            redact,
            close: () => client.close().catch(() => {}),
        };
    } catch (error) {
        await client.close().catch(() => {});
        throw error;
    }
}
