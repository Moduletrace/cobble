import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";

/**
 * The shell script that saves a repository's uncommitted work, and where it
 * puts it.
 *
 * A run does not keep its own copy of anything it edited in place, and a
 * discarded edit leaves no trace: the command succeeds and the tool result
 * reads fine. So the patch is written outside the repository, in the bot's
 * own folder on the computer (`<bot folder>/.cobble/pre-destructive/`), which
 * survives the very command it guards and keeps the repo clean of it.
 *
 * Everything the tree holds is captured, not only the tracked part:
 *  - `git diff` for modified tracked files,
 *  - `git diff --cached` for what was already staged,
 *  - `git diff --no-index --binary -- /dev/null <file>` for each untracked
 *    file, which is what `git clean` deletes and what a run creates most
 *    often (a new module, a test, a report).
 *
 * One call, so the whole check costs one round trip, and the patch is written
 * where the run can read it back and `git apply` it.
 */

/** Where snapshots go, under the bot's folder. */
export const GitSnapshotDir = ".cobble/pre-destructive";

/** How many snapshots are kept; older ones are deleted after each save. */
export const KeepSnapshots = 40;

/**
 * The repository the command works in: the folder the call asked for, else
 * the run's own folder, which is where a shell starts.
 */
export default function gitSnapshotScript({
    dirs,
    cwd,
}: {
    dirs: ComputerRunDirs;
    cwd?: string | null;
}): string {
    const root = cwd || dirs.cwd;
    const dir = `${dirs.bot_dir}/${GitSnapshotDir}`;

    return [
        `root=${shellQuote({ text: root })}`,
        `dir=${shellQuote({ text: dir })}`,
        `mkdir -p "$dir" 2>/dev/null || exit 0`,
        // `safe.directory=*` because a worker's account is not the
        // repository's owner, which git otherwise refuses ("dubious
        // ownership") and nothing would ever be saved.
        `top=$(git -C "$root" rev-parse --show-toplevel 2>/dev/null)`,
        `[ -n "$top" ] || exit 0`,
        // A subshell, so the `cd` stays here and every path inside the patch
        // is relative to the repository root: that is what makes
        // `git -C <top> apply <patch>` restore it.
        `(`,
        `  cd "$top" || exit 0`,
        `  patch="$dir/$(date +%Y%m%d-%H%M%S)-$(basename "$top").patch"`,
        `  {`,
        `    git -c safe.directory='*' diff`,
        `    git -c safe.directory='*' diff --cached`,
        `    git -c safe.directory='*' ls-files --others --exclude-standard -z | while IFS= read -r -d '' file; do`,
        `      git -c safe.directory='*' diff --no-index --binary -- /dev/null "$file" || true`,
        `    done`,
        `  } > "$patch" 2>/dev/null`,
        `  dirty=$(git -c safe.directory='*' status --porcelain 2>/dev/null | wc -l)`,
        `  if [ "$dirty" -gt 0 ] 2>/dev/null; then`,
        `    git -c safe.directory='*' status --porcelain > "$patch.files" 2>/dev/null`,
        `    printf '%s\\t%s\\t%s\\n' "$top" "$dirty" "$patch"`,
        `  else`,
        // Nothing to save: an empty patch on disk would read like a snapshot
        // that failed to capture something.
        `    rm -f "$patch"`,
        `  fi`,
        `)`,
        `ls -1t "$dir" 2>/dev/null | tail -n +${KeepSnapshots + 1} | while read -r old; do rm -f "$dir/$old"; done`,
        `exit 0`,
    ].join("\n");
}