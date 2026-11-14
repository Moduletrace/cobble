/**
 * A shell command split into the parts that run one after another, and the
 * word each part leads with.
 *
 * Two questions about a `computer_bash` command are asked before it runs:
 * whether it only reads (`isReadOnlyCommand`, so an identical repeat is
 * answered from the first answer) and whether it would throw away
 * uncommitted work (`isDestructiveGit`, so the tree is saved first). Both
 * need the same thing, so it lives here rather than twice: what actually
 * runs, past `cd x &&`, pipes and `;` chains.
 */

/** Words that say how the next word runs, never what runs. */
const PrefixWords: readonly string[] = ["sudo", "env", "command", "exec", "time", "nohup", "!"];

/**
 * The parts of a command, in order. Quoted separators are split too, which
 * is wrong in principle and safe in practice: a segment this gets wrong is
 * never mistaken for a read, so it is simply run again.
 */
export function commandSegments({ command }: { command: string }): string[] {
    return command
        .split(/\n|&&|\|\||[;|]/)
        .map((segment) => segment.trim())
        .filter(Boolean);
}

export type LeadingCommand = {
    /** The program's own name, without a path and lower-cased. */
    program: string;
    /** Everything after it, as written. */
    args: string[];
};

/**
 * What a segment runs: the first word that isn't an env assignment
 * (`KEY=value git ...`) or a prefix word (`sudo git ...`). Null when the
 * segment is only those.
 */
export function leadingCommand({ segment }: { segment: string }): LeadingCommand | null {
    const words = segment.trim().split(/\s+/).filter(Boolean);

    let index = 0;

    while (
        index < words.length &&
        (PrefixWords.includes(words[index]!) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index]!))
    ) {
        index++;
    }

    const word = words[index];

    if (!word) return null;

    return {
        program: (word.split("/").pop() || "").toLowerCase(),
        args: words.slice(index + 1),
    };
}