import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import type { ComputerToolContext } from "./computer-tool-context";
import gitSnapshotScript from "./git-snapshot-script";
import parseGitSnapshot, { type GitWorktreeSnapshot } from "./parse-git-snapshot";

const TimeoutMs = 30_000;

/**
 * Saves the uncommitted work of the repository a command is about to
 * discard, before it runs.
 *
 * Called by `computer_bash` when the command would throw work away
 * (`isDestructiveGit`), so a run that discards its own edits can get them
 * back instead of rediscovering the loss: `git checkout -- .` and
 * `git stash` report success either way.
 *
 * The script itself lives in `gitSnapshotScript`; this reads its answer.
 */
export default async function snapshotGitWorktree({
    computer,
    dirs,
    cwd,
    signal,
}: {
    computer: ComputerToolContext["computer"];
    dirs: ComputerRunDirs;
    cwd?: string | null;
    signal?: AbortSignal;
}): Promise<GitWorktreeSnapshot[]> {
    const result = await runComputerCommand({
        computer,
        command: gitSnapshotScript({ dirs, cwd }),
        timeout_ms: TimeoutMs,
        run_as: dirs.run_as,
        signal,
    });

    return parseGitSnapshot({ output: result.output });
}