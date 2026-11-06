import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import shellQuote from "@/src/utils/shell-quote";

/**
 * The shell that puts a command in the run's folder on the computer:
 * creates its folders (the user's in the bot's, and the workspace's shared
 * one), moves into the user's and makes it `HOME`, so `~` and every
 * relative path land there. A worker (its own account, no sudo) also
 * gets `umask 007`, so its files stay its workspace group's and nobody
 * else's, and installs into that home that work without root
 * (`pip install --user`, `npm install -g` into `~/.local`, on `PATH`).
 * Ends with `; `, ready to prefix a command.
 */
export default function computerDirsShell({ dirs }: { dirs: ComputerRunDirs }) {
    const cwd = shellQuote({ text: dirs.cwd });
    const folders = [dirs.cwd, ...(dirs.shared_dir ? [dirs.shared_dir] : [])]
        .map((dir) => shellQuote({ text: dir }))
        .join(" ");

    if (!dirs.run_as) return `mkdir -p ${folders} && cd ${cwd} && export HOME=${cwd}; `;

    return `umask 007 && mkdir -p ${folders} && cd ${cwd} && export HOME=${cwd} && export PATH="$HOME/.local/bin:$PATH" NPM_CONFIG_PREFIX="$HOME/.local"; `;
}
