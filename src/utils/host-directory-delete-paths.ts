import path from "node:path";

/**
 * What a `computer_bash` command would remove, empty or move out of a
 * folder, as the run sees the paths.
 *
 * Deleting inside a folder mounted from the host machine can't be undone
 * on the host, so the app refuses such a command until the user approves
 * it (`host-directory-delete-guard`). This is the part that reads the
 * command: a heuristic, since a script the bot writes and runs can remove
 * anything its account may, but it catches the plain spellings a bot
 * actually uses (`rm -rf`, `find -delete`, `>`, `mv` out, `git clean`).
 */

export type HostDirectoryDeleteTarget = {
    /** The absolute path, as the run sees it (quoted and relative words resolved). */
    path: string;
    /** What it would do to it. */
    kind: "delete" | "truncate" | "move";
    /** For a move: where the path would go. */
    destination?: string;
};

type Params = {
    command: string;
    /** The folder a relative word lands in (the run's own, unless the call named another). */
    cwd: string;
};

/** Words that say how the next word runs, never what runs. */
const PrefixWords: readonly string[] = ["sudo", "env", "command", "exec", "time", "nohup", "nice", "xargs", "!"];
/** Programs that remove what they name. */
const DeletePrograms: readonly string[] = ["rm", "rmdir", "unlink", "shred", "srm"];
/** The words that end one command and start the next. */
const Separators: readonly string[] = [";", "&&", "||", "|", "&", "\n", "(", ")"];
/** Git's global options that take the next word, so it is not the subcommand. */
const GitValueOptions: readonly string[] = ["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--config-env", "--exec-path"];

export default function hostDirectoryDeletePaths({ command, cwd }: Params): HostDirectoryDeleteTarget[] {
    const targets: HostDirectoryDeleteTarget[] = [];

    for (const segment of segments({ command })) {
        targets.push(...segmentTargets({ words: segment, cwd }));
    }

    return dedupe({ targets });
}

/**
 * The command's words, with quotes read as one word, and separators as
 * their own tokens so each command is read on its own.
 */
export function shellWords({ command }: { command: string }): string[] {
    const words: string[] = [];
    let current = "";
    let started = false;
    let quote: "'" | '"' | null = null;

    const flush = () => {
        if (started) words.push(current);
        current = "";
        started = false;
    };

    for (let index = 0; index < command.length; index++) {
        const char = command[index]!;

        if (quote == "'") {
            if (char == "'") quote = null;
            else current += char;
            continue;
        }

        if (quote == '"') {
            if (char == '"') quote = null;
            else if (char == "\\" && index + 1 < command.length) {
                index++;
                current += command[index];
            } else current += char;
            continue;
        }

        if (char == "'" || char == '"') {
            quote = char;
            started = true;
            continue;
        }

        if (char == "\\" && index + 1 < command.length) {
            index++;
            current += command[index];
            started = true;
            continue;
        }

        if (/\s/.test(char) || Separators.includes(char)) {
            flush();
            if (Separators.includes(char)) words.push(char);
            continue;
        }

        if (char == ">" || char == "<") {
            flush();
            const operator = `${char}${command[index + 1] == char ? char : ""}${char == ">" && command[index + 1] == "|" ? "|" : ""}`;
            words.push(operator);
            index += operator.length - 1;
            continue;
        }

        current += char;
        started = true;
    }

    flush();

    return words;
}

/**
 * The words of each command in the line: a separator starts the next one.
 */
function segments({ command }: { command: string }): string[][] {
    const segments: string[][] = [];
    let current: string[] = [];

    for (const word of shellWords({ command })) {
        if (!Separators.includes(word)) {
            current.push(word);
            continue;
        }

        if (current.length) segments.push(current);
        current = [];
    }

    if (current.length) segments.push(current);

    return segments;
}

function segmentTargets({ words, cwd }: { words: string[]; cwd: string }): HostDirectoryDeleteTarget[] {
    const targets: HostDirectoryDeleteTarget[] = [];
    const resolve = (word: string) => resolvePath({ word, cwd });

    /**
     * A redirect that empties the file it names: `>` and `>|` truncate,
     * `>>` only adds.
     */
    for (let index = 0; index < words.length; index++) {
        const word = words[index]!;

        if (word != ">" && word != ">|") continue;

        const target = words[index + 1];

        if (!target || target == "&" || target.startsWith("&")) continue;

        targets.push({ path: resolve(target), kind: "truncate" });
    }

    const lead = leadingProgram({ words });

    if (!lead) return targets;

    const { program, args } = lead;

    if (DeletePrograms.includes(program)) {
        for (const word of pathWords({ args })) {
            targets.push({ path: resolve(word), kind: "delete" });
        }

        return targets;
    }

    if (program == "truncate") {
        for (const word of pathWords({ args })) {
            targets.push({ path: resolve(word), kind: "truncate" });
        }

        return targets;
    }

    if (program == "tee") {
        if (args.some((arg) => arg == "-a" || arg == "--append")) return targets;

        for (const word of pathWords({ args })) {
            targets.push({ path: resolve(word), kind: "truncate" });
        }

        return targets;
    }

    if (program == "dd") {
        for (const word of args) {
            if (!word.startsWith("of=")) continue;

            targets.push({ path: resolve(word.slice(3)), kind: "truncate" });
        }

        return targets;
    }

    if (program == "find") {
        const deletes = args.some(
            (arg, index) =>
                arg == "-delete" ||
                (arg == "-exec" &&
                    ["rm", "rmdir", "unlink", "shred"].includes(String(args[index + 1] || "").split("/").pop() || "")),
        );

        if (!deletes) return targets;

        for (const word of startWords({ args })) {
            targets.push({ path: resolve(word), kind: "delete" });
        }

        return targets;
    }

    if (program == "rsync") {
        const names = pathWords({ args });
        const destination = names[names.length - 1];

        if (!args.includes("--delete") || !destination || names.length < 2) return targets;

        targets.push({ path: resolve(destination), kind: "delete" });

        return targets;
    }

    if (program == "mv") {
        const names = pathWords({ args });
        const destination = names[names.length - 1];

        if (!destination || names.length < 2) return targets;

        for (const word of names.slice(0, -1)) {
            targets.push({ path: resolve(word), kind: "move", destination: resolve(destination) });
        }

        return targets;
    }

    if (program == "git") {
        /**
         * `git clean` and `git rm` delete what is in the tree they run
         * in, which is the cwd unless `-C` names another one.
         */
        let dir = cwd;
        let subcommand: string | null = null;

        for (let index = 0; index < args.length; index++) {
            const arg = args[index]!;

            if (GitValueOptions.includes(arg)) {
                if (arg == "-C" && args[index + 1]) dir = resolve(args[index + 1]!);
                index++;
                continue;
            }

            if (arg.startsWith("-")) continue;

            subcommand = arg;
            break;
        }

        if (subcommand == "clean" || subcommand == "rm") {
            targets.push({ path: dir, kind: "delete" });
        }
    }

    return targets;
}

function leadingProgram({ words }: { words: string[] }) {
    let index = 0;

    while (
        index < words.length &&
        (PrefixWords.includes(words[index]!) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(words[index]!))
    ) {
        index++;
    }

    const word = words[index];

    if (!word) return null;

    return { program: (word.split("/").pop() || "").toLowerCase(), args: words.slice(index + 1) };
}

/**
 * The words a program acts on: flags are skipped, and after `--` nothing
 * is a flag any more (`rm -- -old.log`).
 */
function pathWords({ args }: { args: string[] }): string[] {
    const paths: string[] = [];
    let flags_done = false;

    for (const word of args) {
        if (!flags_done && word == "--") {
            flags_done = true;
            continue;
        }

        if (!flags_done && word.startsWith("-") && word != "-") continue;

        paths.push(word);
    }

    return paths;
}

/**
 * `find`'s starting points: its words before the first test or action.
 */
function startWords({ args }: { args: string[] }): string[] {
    const paths: string[] = [];

    for (const word of args) {
        if (word.startsWith("-")) break;

        paths.push(word);
    }

    return paths;
}

/**
 * The absolute path a word names, as the run's shell would read it: `~`
 * and a relative word land in the cwd.
 */
export function resolvePath({ word, cwd }: { word: string; cwd: string }): string {
    const raw = word.replace(/\\/g, "/");
    const home_relative = raw == "~" ? "" : raw.startsWith("~/") ? raw.slice(2) : null;
    const absolute =
        home_relative != null
            ? path.posix.join(cwd, home_relative)
            : raw.startsWith("/")
              ? raw
              : path.posix.join(cwd, raw || ".");

    return path.posix.normalize(absolute).replace(/(.)\/+$/, "$1");
}

function dedupe({ targets }: { targets: HostDirectoryDeleteTarget[] }): HostDirectoryDeleteTarget[] {
    const seen = new Set<string>();

    return targets.filter((target) => {
        const key = `${target.kind}:${target.path}:${target.destination || ""}`;

        if (seen.has(key)) return false;

        seen.add(key);

        return true;
    });
}