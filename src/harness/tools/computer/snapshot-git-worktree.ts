import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import type { ComputerToolContext } from "./computer-tool-context";
import gitInvocations from "./git-invocations";
import gitSnapshotRoots from "./git-snapshot-roots";
import gitSnapshotScript from "./git-snapshot-script";
import parseGitSnapshot, { type GitWorktreeSnapshot } from "./parse-git-snapshot";

const TimeoutMs = 30_000;

/**
 * Saves the uncommitted work of every repository a command is about to
 * discard, before it runs.
 *
 * Called by `computer_bash` when the command would throw work away
 * (`isDestructiveGit`), so a run that discards its own edits can get them
 * back instead of rediscovering the loss: `git checkout -- .` and
 * `git stash` report success either way.
 *
 * The command's own targets are snapshotted, not only the cwd: `git -C <dir>`
 * and `cd <dir> &&` reach other trees (`gitSnapshotRoots`). A `git clean -x`
 * deletes ignored files too, so those are captured when one is named (M6).
 * The script itself lives in `gitSnapshotScript`; this reads its answer.
 */
export default async function snapshotGitWorktree({
    computer,
    dirs,
    cwd,
    command,
    signal,
}: {
    computer: ComputerToolContext["computer"];
    dirs: ComputerRunDirs;
    cwd?: string | null;
    command: string;
    signal?: AbortSignal;
}): Promise<GitWorktreeSnapshot[]> {
    const roots = gitSnapshotRoots({ command, dirs, cwd });
    const include_ignored = gitInvocations({ command }).some(
        (invocation) =>
            invocation.subcommand == "clean" &&
            invocation.args.some(
                (arg) => arg == "-x" || arg == "--ignored" || (arg.startsWith("-") && !arg.startsWith("--") && arg.includes("x")),
            ),
    );

    const result = await runComputerCommand({
        computer,
        command: gitSnapshotScript({ dirs, roots, include_ignored }),
        timeout_ms: TimeoutMs,
        run_as: dirs.run_as,
        signal,
    });

    return parseGitSnapshot({ output: result.output });
}
