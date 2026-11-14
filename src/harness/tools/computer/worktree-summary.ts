import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";
import capToolOutput from "./cap-tool-output";
import type { ComputerToolContext } from "./computer-tool-context";

/**
 * What is on disk in the run's folders right now, in the machine's own
 * words: every repository's `git status --porcelain` and the summary line of
 * its diff.
 *
 * A run reports what it did from its memory of doing it, which drifts: it
 * describes the file it meant to write rather than the one it wrote, and it
 * says "written" about an edit that a later command reverted. Handing it the
 * literal output at the moment it writes its report gives it nothing to
 * reconstruct, and gives the reader a list that matches the tree.
 *
 * Nested repositories are found too: a run's folder often holds a checkout
 * one or two levels down rather than itself.
 */

/** How many repositories are summarised; a folder with more is unusual. */
const MaxRepositories = 5;

/** How deep a nested checkout is looked for, past `node_modules`. */
const MaxDepth = 4;

const MaxChars = 2_000;

const TimeoutMs = 60_000;

export default async function worktreeSummary({
    computer,
    dirs,
    signal,
}: {
    computer: ComputerToolContext["computer"];
    dirs: ComputerRunDirs;
    signal?: AbortSignal;
}): Promise<string> {
    const result = await runComputerCommand({
        computer,
        command: summaryScript({ dirs }),
        timeout_ms: TimeoutMs,
        run_as: dirs.run_as,
        signal,
    });

    const text = result.output.trim();

    if (!text) return "";

    return capToolOutput({ text, max_chars: MaxChars });
}

/**
 * One script: find the repositories, then print what each holds.
 *
 * `-c safe.directory=*` because a worker's account is not the checkout's
 * owner; `node_modules` is pruned so the walk stays cheap.
 */
function summaryScript({ dirs }: { dirs: ComputerRunDirs }): string {
    const roots = [dirs.cwd, dirs.bot_dir, dirs.shared_dir || ""].filter(
        (root, index, all) => root && all.indexOf(root) == index,
    );

    const lookups = roots.map(
        (root) => `git -C ${shellQuote({ text: root })} rev-parse --show-toplevel 2>/dev/null`,
    );

    const walks = roots.map(
        (root) =>
            `find ${shellQuote({
                text: root,
            })} -maxdepth ${MaxDepth} -name node_modules -prune -o -name .git -print 2>/dev/null | sed 's|/.git$||'`,
    );

    return [
        `{`,
        ...lookups,
        ...walks,
        `} 2>/dev/null | sort -u | head -n ${MaxRepositories} | while read -r top; do`,
        `  [ -n "$top" ] || continue`,
        `  [ -d "$top" ] || continue`,
        `  printf '== %s\\n' "$top"`,
        `  git -C "$top" -c safe.directory='*' status --porcelain 2>/dev/null`,
        `  git -C "$top" -c safe.directory='*' diff --stat 2>/dev/null | tail -n 3`,
        `done`,
    ].join("\n");
}