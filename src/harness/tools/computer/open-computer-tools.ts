import { AppData } from "@/src/data/app-data";
import { ComputerMcpExcludedTools } from "@/src/dict/computer-dict";
import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import grabComputerEnvs from "@/src/functions/backend/db/envs/grab-computer-envs";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import redactSecrets from "@/src/utils/redact-secrets";
import connectMcpServer from "../../mcp/connect-mcp-server";
import grabMcpTools from "../../mcp/grab-mcp-tools";
import readImage from "../../media/read-image";
import type { HarnessTool } from "../../types";
import computerDirsShell from "./computer-dirs-shell";
import captureSecretTool from "./capture-secret-tool";
import runComputerCommand from "./run-computer-command";
import withComputerDirs from "./with-computer-dirs";
import withComputerEnv from "./with-computer-env";
import writeComputerEnv from "./write-computer-env";

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
 * Connects to a computer (its AIO sandbox, over MCP) and returns its tools:
 * shell, files, code and browser. Its envs (`grabComputerEnvs`) are written
 * to the computer and loaded by the shell and code tools; secret values are
 * redacted from everything the tools return. Every tool is kept in the
 * run's folders (`withComputerDirs`), which are created first. Screenshots
 * come back as readings from the media reading harness. Call `close` when the run ends.
 * Throws when the computer can't be reached, which the queue retries.
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
    const paths = await writeComputerEnv({ base_url: target.base_url, envs, signal });

    await runComputerCommand({
        base_url: target.base_url,
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

    const client = await connectMcpServer({ url: target.url, signal });

    try {
        const tools = await grabMcpTools({
            client,
            exclude: ComputerMcpExcludedTools,
            redact,
            describeImage: ({ data, mime_type }) =>
                readImage({
                    url: `data:${mime_type};base64,${data}`,
                    focus: "This is a screenshot of a computer screen. Describe the page layout, text, buttons and form fields, and any errors or popups.",
                    signal,
                    bot_id,
                    workspace_id,
                }),
        });

        return {
            name: target.name,
            tools: [
                ...tools.map((tool) => withComputerDirs({ tool: withComputerEnv({ tool, ...paths }), dirs })),
                ...(user_id && bot_id && onSecretRef
                    ? [
                          captureSecretTool({
                              base_url: target.base_url,
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
