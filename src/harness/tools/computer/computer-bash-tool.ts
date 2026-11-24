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
import isDestructiveGit from "./destructive-command";
import gitSnapshotNote from "./git-snapshot-note";
import hostDirectoryDeleteGuard from "./host-directory-delete-guard";
import type { GitWorktreeSnapshot } from "./parse-git-snapshot";
import snapshotGitWorktree from "./snapshot-git-worktree";

type Args = {
    command: string;
    cwd?: string;
    timeout?: number | "unlimited";
};

/**
 * A bash command on the run's computer, from the run's folder (its
 * `HOME`), with the computer's envs loaded, as the worker's own account
 * (no sudo) or, for the coordinator, the computer's user (with sudo).
 * Each call is stopped after the bot's `timeout`, or `AppData.
 * ComputerCommandDefaultSeconds` when it names none, or not at all for
 * `"unlimited"` (`commandTimeoutSeconds`); a limit the install set
 * (`AppData.ComputerCommandMaxSeconds`) caps any of them. The default is
 * what keeps a command that waits on a pty that never sees EOF, or a
 * prompt nothing can answer, from hanging the whole run.
 */
export default function computerBashTool({ computer, computer_id, dirs, shell_path, redact, bot_id, workspace_id, session_id }: ComputerToolContext): HarnessTool<Args> {
    const max = AppData.ComputerCommandMaxSeconds;
    const default_seconds = AppData.ComputerCommandDefaultSeconds;
    const timeout_note = max > 0
        ? `Seconds before it is stopped, at most ${max} (${max} when left out; "unlimited" also means ${max}).`
        : `Seconds before it is stopped (${default_seconds} when left out). Pass "unlimited" for work that really takes long.`;

    return {
        name: "computer_bash",
        description: `Run a bash command on this computer (${
            computer.connection === "ssh"
                ? "reached over SSH as the user set for it: you have exactly that user's privileges, sudo only if it has it"
                : dirs.run_as
                    ? `Debian, as your own account ${computerWorkerAccount({ bot_id: dirs.run_as.bot_id }).name}, without sudo: other bots' folders and the computer's own services are closed to you. Install Python and Node packages into your folder yourself (pip install --user ..., npm install -g ...: both land in ~/.local, on your PATH); for a system package (apt) or anything else that needs root, ask with request_install`
                    : "Debian, as the user gem, with passwordless sudo: install what you need with sudo apt-get update && sudo apt-get install -y ..., or pip install. Worker bots' folders belong to their own accounts, so read or change them with sudo"
        }). It starts in your folder (${dirs.cwd}, also ~ and $HOME) with your envs set. Every call is a fresh shell (cd and export don't carry over), reads no input (anything waiting for a prompt fails at once: pass -y, a password through its env, and so on). A command is stopped after ${Math.round((max > 0 ? max : default_seconds) / 60)} minutes unless you pass timeout seconds, or timeout: "unlimited" for work that really takes longer (an install, a build). Work that must outlive the run goes in the background (nohup ... > log 2>&1 &), checked in later calls. Output past ${Math.round(AppData.ComputerCommandMaxOutputChars / 1000)}k characters is cut in the middle, so filter it.`,
        /**
         * The command's own limit is what ends it: the harness's per-tool
         * deadline would cut a long script at 10 minutes.
         */
        timeout_ms: null,
        schema: z.object({
            command: z.string().min(1).max(100_000),
            cwd: z.string().max(AppData.BotFilePathMaxChars).optional().describe("Where to start (defaults to your folder)"),
            timeout: z.union([z.number().positive(), z.literal("unlimited")]).optional().describe(timeout_note),
        }),
        run: async ({ args, signal }) => {
            const cwd = args.cwd ? resolveComputerPath({ path: args.cwd, dirs }) : null;
            const seconds = commandTimeoutSeconds({ asked: args.timeout, max });

            /**
             * A delete inside a folder mounted from the host machine is the
             * user's data, and can't be undone there: hold it until they
             * approved it, then keep a copy of what it removes.
             */
            const gate = await hostDirectoryDeleteGuard({
                command: args.command,
                cwd,
                context: { computer, computer_id, dirs, shell_path, redact, bot_id, workspace_id, session_id },
                signal,
            });

            if (gate?.blocked) return gate.blocked;

            /**
             * Before anything that would throw uncommitted work away: keep it
             * outside the repository, and say where in the result, so a run
             * that just discarded its own edits can get them back instead of
             * rediscovering the loss. If the snapshot itself cannot be saved,
             * the command still runs, but the result says the work it discards
             * may be unrecoverable rather than implying it was kept (M6).
             */
            let snapshots: GitWorktreeSnapshot[] = [];
            let snapshot_failed = false;

            if (isDestructiveGit({ command: args.command })) {
                try {
                    snapshots = await snapshotGitWorktree({ computer, dirs, cwd, command: args.command, signal });
                } catch {
                    snapshot_failed = true;
                }
            }

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
                gate?.note || "",
                gitSnapshotNote({ snapshots }),
                snapshot_failed ? `[The safety snapshot could not be saved before this command; any work it discards may be unrecoverable.]` : "",
                `Exit code: ${result.exit_code ?? "unknown"}`,
                output || "(no output)",
                result.timed_out ? `[Stopped after ${seconds ?? 0}s: the command timed out. Run long work in the background and check its log, or pass a larger timeout, or timeout: "unlimited".]` : "",
                result.truncated ? `[The computer kept only the first part of a very long output.]` : "",
                full || "",
            ]
                .filter(Boolean)
                .join("\n");
        },
    };
}
