import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import grabComputerMcpUrl from "@/src/functions/backend/db/computers/grab-computer-mcp-url";
import grabComputerEnvs from "@/src/functions/backend/db/envs/grab-computer-envs";
import computerRef from "@/src/utils/computer-ref";
import computerNotReadyMessage from "@/src/utils/computer-not-ready-message";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import redactSecrets from "@/src/utils/redact-secrets";
import type { HarnessTool } from "../../types";
import computerDirsShell from "./computer-dirs-shell";
import runComputerCommand from "./run-computer-command";

type Params = {
    /**
     * The bot the run is for: its own envs beat everything.
     */
    bot_id?: number | string | null;
    /**
     * The workspace the run is in: its envs apply.
     */
    workspace_id?: number | string | null;
    /**
     * The bot's computers, the current one first (`grabBotComputers`).
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
    /**
     * The run's folders (`computerRunDirs`): the command starts in the
     * user's.
     */
    dirs: ComputerRunDirs;
};

type Args = {
    command: string;
};

/**
 * Lets a bot look for something across every computer it has: one shell
 * command runs on each at once (`runComputerCommand`), and the outputs come
 * back labelled with each computer's ref (`computerRef`), secrets redacted,
 * so the bot can tell the user exactly which computer holds what. It
 * starts in the run's own folder on each (`computerDirsShell`).
 */
export default function searchComputersTool({
    bot_id,
    workspace_id,
    computers,
    dirs,
}: Params): HarnessTool<Args> {
    return {
        name: "search_computers",
        description: `Run one read-only shell command (bash) on every computer you have at once, to find which one holds something: a file, a running app, a logged-in browser session, a setting. Each computer's output comes back under its ref, e.g. ${computerRef({ id: computers[0]?.id || 1 })}. For a logged-in site, look for its domain in the browser profiles' cookie databases (copy the file first, since the browser locks it) and list only host names, never cookie values. It starts in your folder on each computer (${dirs.cwd}, also ~). Don't change anything with it; use start_task for that. Output past ${AppData.ComputerSearchMaxOutputChars} characters per computer is cut, so filter in the command.`,
        schema: z.object({
            command: z.string().min(1).max(4000),
        }),
        run: async ({ args, signal }) => {
            const results = await Promise.all(
                computers.map(async (computer) => {
                    const label = `## ${computerRef({ id: computer.id || 0 })} ${computer.name || "Computer"}`;

                    try {
                        const target = await grabComputerMcpUrl({ computer_id: computer.id || 0 });

                        if (!target) return `${label}\nNot reachable: it has no container.`;

                        if (!target.ready) return `${label}\nNot reachable: ${computerNotReadyMessage(target)}`;

                        const [result, envs] = await Promise.all([
                            runComputerCommand({
                                base_url: target.base_url,
                                command: `${computerDirsShell({ dirs })}${args.command}`,
                                timeout_ms: AppData.ComputerSearchTimeoutMs,
                                signal,
                            }),
                            grabComputerEnvs({
                                computer_id: computer.id || 0,
                                bot_id,
                                workspace_id,
                            }),
                        ]);

                        const output = redactSecrets({
                            text: result.output.trim(),
                            secrets: envs.filter((env) => env.secret),
                        });
                        const cut = output.length > AppData.ComputerSearchMaxOutputChars;

                        return [
                            label,
                            `Exit code: ${result.exit_code ?? "unknown"}`,
                            output ? output.slice(0, AppData.ComputerSearchMaxOutputChars) : "(no output)",
                            cut ? `(output cut at ${AppData.ComputerSearchMaxOutputChars} characters)` : "",
                        ]
                            .filter(Boolean)
                            .join("\n");
                    } catch (error) {
                        return `${label}\nNot reachable: ${error instanceof Error ? error.message : String(error)}`;
                    }
                }),
            );

            return results.join("\n\n");
        },
    };
}
