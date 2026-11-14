import type { GitInvocation } from "./git-invocations";
import gitInvocations from "./git-invocations";

/**
 * Whether a `computer_bash` command would throw away uncommitted work.
 *
 * A run that stashes, hard-resets or checks out over its own tree can lose
 * an hour of edits with one call, and nothing reports it: the command
 * succeeded, so the tool result reads fine and the files are simply gone.
 * One run lost its uncommitted wiring that way (`git stash push -u`, then
 * `git checkout -- .`, then the pop returned only what was untracked) and
 * spent its remaining steps re-deriving the loss instead of shipping.
 *
 * Only the git calls that actually discard are matched. A plain
 * `git checkout main` is not one: with a dirty tree git refuses it rather
 * than overwrite, so it cannot lose anything on its own.
 */
export default function isDestructiveGit({ command }: { command: string }): boolean {
    return gitInvocations({ command }).some((invocation) => discardsWork({ invocation }));
}

/**
 * One git call: whether it takes work out of the tree, or deletes what was
 * never committed.
 */
function discardsWork({ invocation }: { invocation: GitInvocation }): boolean {
    const { subcommand, args } = invocation;
    const first = args[0] || "";

    switch (subcommand) {
        /**
         * Throws away every uncommitted change in the paths it names, which
         * is `.` or `--` followed by anything, or the whole tree with `-f`.
         */
        case "checkout":
            return args.some((arg) => arg == "--" || arg == "." || arg == "-f" || arg == "--force" || arg == "-B");

        /** Restores paths from the index or a commit: always a discard. */
        case "restore":
            return true;

        /** `--hard` moves HEAD and the tree; the softer ones keep the work. */
        case "reset":
            return args.includes("--hard");

        /** Deletes untracked files, which no commit can bring back. */
        case "clean":
            return !args.includes("-n") && !args.includes("--dry-run");

        /** `list` and `show` read; everything else moves or drops a stash. */
        case "stash":
            return first != "list" && first != "show";

        /** `switch` discards only when asked to. */
        case "switch":
            return args.some((arg) => arg == "--discard-changes" || arg == "-f" || arg == "--force");

        /** Deletes tracked files from the tree and the index. */
        case "rm":
            return true;

        /** Removes another worktree's folder, with whatever it held. */
        case "worktree":
            return first == "remove";

        default:
            return false;
    }
}