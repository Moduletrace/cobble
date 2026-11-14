import { parseGitInvocation } from "./git-invocations";
import { commandSegments, leadingCommand } from "./shell-command";

/**
 * Whether a `computer_bash` command only reads.
 *
 * A run that keeps calling `cat`, `grep` or `stat` on the same file pays for
 * it twice: once in the call and again in every turn that resends the
 * transcript. `RepeatableToolNames` cannot cover a shell, because a shell
 * can write anything, so this recognises the commands that provably cannot:
 * a list of read-only programs, no redirection, no command substitution and
 * no `tee`, with a short list of git subcommands that only print.
 *
 * Everything else is answered by running it again, which is the safe
 * direction: a missed repeat costs one call, a wrong one answers a read with
 * what an earlier, different command printed. Programs that can write
 * through their own text (`sed -e 'w file'`, `awk 'BEGIN{system(...)}'`) are
 * deliberately not on the list.
 */

/** Programs that only print what they are given or what they find. */
const ReadOnlyPrograms: readonly string[] = [
    "basename",
    "cat",
    "cd",
    "cmp",
    "column",
    "comm",
    "cut",
    "date",
    "df",
    "diff",
    "dirname",
    "du",
    "echo",
    "fgrep",
    "file",
    "find",
    "free",
    "grep",
    "head",
    "hexdump",
    "hostname",
    "id",
    "jq",
    "ls",
    "md5sum",
    "nl",
    "nproc",
    "od",
    "printenv",
    "printf",
    "ps",
    "pwd",
    "readlink",
    "realpath",
    "rg",
    "sha256sum",
    "sort",
    "stat",
    "strings",
    "tail",
    "tree",
    "type",
    "uname",
    "uniq",
    "uptime",
    "wc",
    "which",
    "whoami",
];

/** Flags that make an otherwise read-only program write. */
const WritingFlags: readonly string[] = [
    "-delete",
    "-exec",
    "-execdir",
    "-fls",
    "-fprint",
    "-fprint0",
    "-ok",
    "-okdir",
    "--pre",
    "--output",
];

/** Programs whose `-o` names a file instead of a format. */
const OutputFlagPrograms: readonly string[] = ["sort"];

/** Anything that writes whatever follows, runs a program, or feeds one. */
const WritesOrRuns = /(>>?|\$\(|`|\btee\b|\bxargs\b)/;

/** git subcommands that only print. */
const ReadOnlyGitSubcommands: readonly string[] = [
    "blame",
    "branch",
    "cat-file",
    "config",
    "count-objects",
    "describe",
    "diff",
    "for-each-ref",
    "log",
    "ls-files",
    "ls-remote",
    "ls-tree",
    "merge-base",
    "name-rev",
    "reflog",
    "remote",
    "rev-parse",
    "show",
    "show-ref",
    "stash",
    "status",
    "tag",
    "whatchanged",
];

/** The only flags `branch` and `tag` may carry: the ones that list. */
const ListingFlags: readonly string[] = [
    "-a",
    "-l",
    "-n",
    "-r",
    "-v",
    "-vv",
    "--all",
    "--contains",
    "--format",
    "--list",
    "--merged",
    "--no-merged",
    "--points-at",
    "--remotes",
    "--show-current",
    "--sort",
    "--verbose",
];

export default function isReadOnlyCommand({ command }: { command: string }): boolean {
    if (!command.trim()) return false;
    if (WritesOrRuns.test(command)) return false;

    const segments = commandSegments({ command });

    if (!segments.length) return false;

    return segments.every((segment) => segmentReads({ segment }));
}

/**
 * One segment: what it runs, and whether that can write.
 */
function segmentReads({ segment }: { segment: string }): boolean {
    const leading = leadingCommand({ segment });

    if (!leading) return false;

    if (leading.program == "git") return gitReads({ args: leading.args });

    if (!ReadOnlyPrograms.includes(leading.program)) return false;

    if (leading.args.some((arg) => WritingFlags.some((flag) => arg.startsWith(flag)))) return false;

    if (OutputFlagPrograms.includes(leading.program) && leading.args.includes("-o")) return false;

    if (leading.program == "date" && leading.args.includes("-s")) return false;

    return true;
}

/**
 * A git call: a subcommand from the list above, with no flag that writes
 * (`branch -D`, `tag -d`, `config user.name=x`, `--output=file`).
 */
function gitReads({ args }: { args: string[] }): boolean {
    const invocation = parseGitInvocation({ args });

    if (!invocation) return false;

    const { subcommand, args: rest } = invocation;

    if (!ReadOnlyGitSubcommands.includes(subcommand)) return false;

    if (rest.some((arg) => arg.startsWith("--output"))) return false;

    if (subcommand == "branch" || subcommand == "tag") {
        return rest.every((arg) => ListingFlags.some((flag) => arg == flag || arg.startsWith(`${flag}=`)));
    }

    if (subcommand == "remote") {
        return rest.every((arg) => arg == "-v" || arg == "--verbose");
    }

    if (subcommand == "config") {
        return rest.some((arg) => arg == "--get" || arg == "--get-all" || arg == "--list" || arg == "-l");
    }

    if (subcommand == "stash") {
        return rest[0] == "list" || rest[0] == "show";
    }

    return true;
}