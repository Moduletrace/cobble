import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import { resolveComputerPath } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";
import type { HarnessTool } from "../../types";
import capToolOutput from "./cap-tool-output";
import computerDirsShell from "./computer-dirs-shell";
import type { ComputerToolContext } from "./computer-tool-context";

type Args = {
    command: string;
    cwd?: string;
    timeout?: number;
};

/**
 * A bash command on the run's computer, from the run's folder (its
 * `HOME`), with the computer's envs loaded. Each call is its own shell,
 * stopped on the computer at its timeout (at most
 * `AppData.ComputerCommandMaxSeconds`) or when the run is stopped, so a
 * command that never ends can't block the computer.
 */
export default function computerBashTool({ computer, dirs, shell_path, redact }: ComputerToolContext): HarnessTool<Args> {
    const max = AppData.ComputerCommandMaxSeconds;

    return {
        name: "computer_bash",
        description: `Run a bash command on this computer (Debian, as the user gem, with passwordless sudo: install what you need with sudo apt-get update && sudo apt-get install -y ..., or pip install). It starts in your folder (${dirs.cwd}, also ~ and $HOME) with your envs set. Every call is a fresh shell (cd and export don't carry over), reads no input (anything waiting for a prompt fails at once: pass -y, a password through its env, and so on) and is stopped after timeout seconds (at most ${max}, ${max} when not given). Start longer work in the background (nohup ... > log 2>&1 &) and check its log in later calls. Output past ${Math.round(AppData.ComputerCommandMaxOutputChars / 1000)}k characters is cut in the middle, so filter it.`,
        schema: z.object({
            command: z.string().min(1).max(100_000),
            cwd: z.string().max(AppData.BotFilePathMaxChars).optional().describe("Where to start, inside your folders"),
            timeout: z.number().positive().optional().describe(`Seconds, at most ${max}`),
        }),
        run: async ({ args, signal }) => {
            const cwd = args.cwd ? resolveComputerPath({ path: args.cwd, dirs }) : null;
            const seconds = Math.min(max, Math.max(1, Math.ceil(args.timeout || max)));

            const result = await runComputerCommand({
                computer,
                command: [
                    computerDirsShell({ dirs }),
                    `[ -f ${shell_path} ] && . ${shell_path}; `,
                    cwd ? `cd ${shellQuote({ text: cwd })} && ` : "",
                    args.command,
                ].join(""),
                timeout_ms: seconds * 1000,
                signal,
            });

            const output = capToolOutput({ text: redact(result.output.replace(/\s+$/, "")), max_chars: AppData.ComputerCommandMaxOutputChars });

            return [
                `Exit code: ${result.exit_code ?? "unknown"}`,
                output || "(no output)",
                result.timed_out ? `[Stopped after ${seconds}s: the command timed out. Run long work in the background and check its log.]` : "",
                result.truncated ? `[The computer kept only the first part of a very long output.]` : "",
            ]
                .filter(Boolean)
                .join("\n");
        },
    };
}
