import { commandSegments, leadingCommand } from "./shell-command";

/**
 * Every `git` call in a shell command, split into the subcommand and what
 * follows it.
 *
 * Both the read-only test and the destructive test read a command this way,
 * so `git -C dir status`, `git -c core.x=y status` and `sudo git status`
 * are all recognised instead of only the plain spelling.
 */

export type GitInvocation = {
    /** The subcommand, lower-cased (`status`, `reset`, `checkout`). */
    subcommand: string;
    /** Everything after the subcommand, including its flags. */
    args: string[];
};

/**
 * Global git options that take the next word as their value, so that value
 * is not read as the subcommand.
 */
const ValueOptions: readonly string[] = [
    "-C",
    "-c",
    "--git-dir",
    "--work-tree",
    "--namespace",
    "--config-env",
    "--exec-path",
];

export default function gitInvocations({ command }: { command: string }): GitInvocation[] {
    const invocations: GitInvocation[] = [];

    for (const segment of commandSegments({ command })) {
        const leading = leadingCommand({ segment });

        if (!leading || leading.program != "git") continue;

        const invocation = parseGitInvocation({ args: leading.args });

        if (invocation) invocations.push(invocation);
    }

    return invocations;
}

/**
 * The subcommand and its arguments, past git's own global options. Null when
 * the words hold no subcommand (`git -C dir` and nothing else).
 */
export function parseGitInvocation({ args }: { args: string[] }): GitInvocation | null {
    for (let index = 0; index < args.length; index++) {
        const arg = args[index]!;

        if (ValueOptions.includes(arg)) {
            index++;
            continue;
        }

        if (arg.startsWith("-")) continue;

        return { subcommand: arg.toLowerCase(), args: args.slice(index + 1) };
    }

    return null;
}