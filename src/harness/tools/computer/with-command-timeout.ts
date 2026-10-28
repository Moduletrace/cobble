import { AppData } from "@/src/data/app-data";
import type { HarnessTool } from "../../types";
import { shellQuote } from "./download-computer-file";

type Params = {
    tool: HarnessTool;
};

/**
 * Makes the computer's bash tool stop its commands on the computer. The
 * sandbox ignores the tool's `timeout` and runs every call in one shared
 * shell session, so a command that never ends (a network read without a
 * timeout, a password prompt) used to keep running after the call gave up,
 * and every later command on that computer, from any run, waited behind
 * it. Each command now runs under `timeout` (its own, at most
 * `ComputerCommandMaxSeconds`), reading no input, in its own bash, and
 * says so when it was stopped. Other tools pass through.
 */
export default function withCommandTimeout({ tool }: Params): HarnessTool {
    if (tool.name != "sandbox_execute_bash") return tool;

    const max = AppData.ComputerCommandMaxSeconds;

    return {
        ...tool,
        description: `${tool.description}\n\nEvery command runs in a fresh shell (cd and export don't carry over to the next call), reads no input (anything waiting for a prompt fails at once: pass -y, a password through its env, and so on) and is stopped after timeout seconds (at most ${max}, ${max} when not given). Start longer work in the background (nohup ... > log 2>&1 &) and check its log in later calls.`,
        run: async ({ args, signal }) => {
            if (typeof args?.cmd != "string") return tool.run({ args, signal });

            const seconds = commandSeconds({ timeout: args.timeout });

            return tool.run({
                args: { ...args, timeout: seconds + 10, cmd: timedCommand({ cmd: args.cmd, seconds }) },
                signal,
            });
        },
    };
}

/**
 * The command's own timeout in whole seconds, kept to 1..`ComputerCommandMaxSeconds`.
 */
function commandSeconds({ timeout }: { timeout?: unknown }) {
    const max = AppData.ComputerCommandMaxSeconds;
    const asked = typeof timeout == "number" ? timeout : Number(timeout);

    if (!Number.isFinite(asked) || asked <= 0) return max;

    return Math.min(max, Math.max(1, Math.ceil(asked)));
}

/**
 * `cmd` under `timeout` (TERM, then KILL 5 seconds later, to its whole
 * process group), with its exit code kept. Never `exit`s: the sandbox's
 * session shell would go with it.
 */
function timedCommand({ cmd, seconds }: { cmd: string; seconds: number }) {
    return [
        `timeout -k 5 ${seconds} bash -c ${shellQuote({ text: cmd })} < /dev/null`,
        `_cobble_status=$?`,
        `if [ $_cobble_status -eq 124 ] || [ $_cobble_status -eq 137 ]; then echo "[Stopped after ${seconds}s: the command timed out. Run long work in the background and check its log.]"; fi`,
        `(exit $_cobble_status)`,
    ].join("; ");
}
