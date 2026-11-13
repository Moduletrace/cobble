import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import { resolveComputerPath } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";
import type { HarnessTool } from "../../types";
import computerWorkerAccount from "@/src/utils/computer-worker-account";
import capToolOutput from "./cap-tool-output";
import commandTimeoutSeconds from "./command-timeout";
import computerDirsShell from "./computer-dirs-shell";
import type { ComputerToolContext } from "./computer-tool-context";
import { computerWorkspaceFullWarning } from "./computer-workspace-room";

type Args = {
    command: string;
    cwd?: string;
    timeout?: number;
};

/**
 * A bash command on the run's computer, from the run's folder (its
 * `HOME`), with the computer's envs loaded, as the worker's own account
 * (no sudo) or, for the coordinator, the computer's user (with sudo).
 * Each call is its own shell with no time limit of its own: it runs until
 * the command ends, the run is stopped, or it reaches the `timeout` the
 * bot named (`commandTimeoutSeconds`, capped by
 * `AppData.ComputerCommandMaxSeconds` when that is set), so a long script
 * is never cut short and nothing is left blocking the computer.
 */
export default function computerBashTool({ computer, dirs, shell_path, redact }: ComputerToolContext): HarnessTool<Args> {
    const max = AppData.ComputerCommandMaxSeconds;
    const timeout_note = max > 0
        ? `Seconds before it is stopped, at most ${max} (${max} when left out).`
        : "Seconds before it is stopped. Left out, it has no time limit.";

    return {
        name: "computer_bash",
        description: `Run a bash command on this computer (Debian, ${
            dirs.run_as
                ? `as your own account ${computerWorkerAccount({ bot_id: dirs.run_as.bot_id }).name}, without sudo: other bots' folders and the computer's own services are closed to you. Install Python and Node packages into your folder yourself (pip install --user ..., npm install -g ...: both land in ~/.local, on your PATH); for a system package (apt) or anything else that needs root, ask with request_install`
                : `as the user gem, with passwordless sudo: install what you need with sudo apt-get update && sudo apt-get install -y ..., or pip install. Worker bots' folders belong to their own accounts, so read or change them with sudo`
        }). It starts in your folder (${dirs.cwd}, also ~ and $HOME) with your envs set. Every call is a fresh shell (cd and export don't carry over), reads no input (anything waiting for a prompt fails at once: pass -y, a password through its env, and so on) and has no time limit${max > 0 ? ` unless you pass timeout seconds (at most ${max})` : ""}: it runs until the command ends, you stop it, or the run ends. Work that must outlive the run goes in the background (nohup ... > log 2>&1 &), checked in later calls. Output past ${Math.round(AppData.ComputerCommandMaxOutputChars / 1000)}k characters is cut in the middle, so filter it.`,
        /**
         * The command's own limit is what ends it: the harness's per-tool
         * deadline would cut a long script at 10 minutes.
         */
        timeout_ms: null,
        schema: z.object({
            command: z.string().min(1).max(100_000),
            cwd: z.string().max(AppData.BotFilePathMaxChars).optional().describe("Where to start, inside your folders"),
            timeout: z.number().positive().optional().describe(timeout_note),
        }),
        run: async ({ args, signal }) => {
            const cwd = args.cwd ? resolveComputerPath({ path: args.cwd, dirs }) : null;
            const seconds = commandTimeoutSeconds({ asked: args.timeout, max });

            const result = await runComputerCommand({
                computer,
                command: [
                    computerDirsShell({ dirs }),
                    `[ -f ${shell_path} ] && . ${shell_path}; `,
                    cwd ? `cd ${shellQuote({ text: cwd })} && ` : "",
                    args.command,
                ].join(""),
                timeout_ms: seconds == null ? null : seconds * 1000,
                run_as: dirs.run_as,
                signal,
            });

            const output = capToolOutput({ text: redact(result.output.replace(/\s+$/, "")), max_chars: AppData.ComputerCommandMaxOutputChars });

            /**
             * A command writes whatever it likes, past what the agent sees:
             * say when the workspace has outgrown its limit, so the bot
             * clears space before its next write is refused.
             */
            const full = await computerWorkspaceFullWarning({ computer, dirs }).catch(() => null);

            return [
                `Exit code: ${result.exit_code ?? "unknown"}`,
                output || "(no output)",
                result.timed_out ? `[Stopped after ${seconds ?? 0}s: the command timed out. Run long work in the background and check its log.]` : "",
                result.truncated ? `[The computer kept only the first part of a very long output.]` : "",
                full || "",
            ]
                .filter(Boolean)
                .join("\n");
        },
    };
}
