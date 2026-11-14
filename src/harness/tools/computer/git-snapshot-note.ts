import type { GitWorktreeSnapshot } from "./parse-git-snapshot";

/**
 * The line a `computer_bash` result carries when the command it ran would
 * have discarded uncommitted work.
 *
 * It leads the result, before the command's own output, because the point is
 * to be read at the moment the run decides what to do next: the work is not
 * lost, it is here, and here is how to get it back.
 */
export default function gitSnapshotNote({
    snapshots,
}: {
    snapshots: GitWorktreeSnapshot[];
}): string {
    if (!snapshots.length) return "";

    const lines = snapshots.map(
        ({ top, files, patch }) =>
            `- ${top}: ${files} uncommitted path${files == 1 ? "" : "s"} saved to ${patch} (and ${
                files == 1 ? "a file listing it" : "a file listing them"
            }: ${patch}.files). Restore with: git -C ${top} apply ${patch}`,
    );

    return `[This command would have discarded uncommitted work. It was saved first:]\n${lines.join("\n")}`;
}