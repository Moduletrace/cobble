/**
 * The one line `snapshotGitWorktree` prints: where the repo is, how many
 * files it had uncommitted, and where the patch landed.
 *
 * A path can hold a tab and a repo cannot be trusted to print anything else,
 * so the line is read back rather than grepped: `top`, a tab, the file count,
 * a tab, the patch path.
 */

export type GitWorktreeSnapshot = {
    /** The repository's root, as git prints it. */
    top: string;
    /** How many paths `git status --porcelain` listed. */
    files: number;
    /** The patch holding the work that was uncommitted. */
    patch: string;
};

export default function parseGitSnapshot({ output }: { output: string }): GitWorktreeSnapshot[] {
    const snapshots: GitWorktreeSnapshot[] = [];

    for (const line of output.split("\n")) {
        if (!line.trim()) continue;

        const [top, files, patch] = line.split("\t");

        if (!top || !patch) continue;

        const count = Number(files);

        snapshots.push({ top, files: Number.isFinite(count) ? count : 0, patch });
    }

    return snapshots;
}