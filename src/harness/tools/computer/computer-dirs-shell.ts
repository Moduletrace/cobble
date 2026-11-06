import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import computerWorkspacePath from "@/src/utils/computer-workspace-path";
import shellQuote from "@/src/utils/shell-quote";

/**
 * The shell that puts a command in the run's folder on the computer:
 * creates the user's folder in the bot's, moves into it and makes it
 * `HOME`, so `~` and every relative path land there. The coordinator also
 * creates the workspace's shared folder. A worker's shared folder is a
 * link in its own (`workspaces/<id>`, made by the computer's agent) to the
 * real one; when it's gone the link is put back, never a folder made in
 * its place, which would keep the workspace's work from its other bots. A
 * worker (its own account, no sudo) also gets `umask 007`, so its files
 * stay its workspace group's and nobody else's, and installs into that
 * home that work without root (`pip install --user`, `npm install -g` into
 * `~/.local`, on `PATH`). Ends with `; `, ready to prefix a command.
 */
export default function computerDirsShell({ dirs }: { dirs: ComputerRunDirs }) {
    const cwd = shellQuote({ text: dirs.cwd });

    if (!dirs.run_as) {
        const folders = [dirs.cwd, ...(dirs.shared_dir ? [dirs.shared_dir] : [])]
            .map((dir) => shellQuote({ text: dir }))
            .join(" ");

        return `mkdir -p ${folders} && cd ${cwd} && export HOME=${cwd}; `;
    }

    const shared = dirs.shared_dir ? sharedLinkShell({ link: dirs.shared_dir }) : "";

    return `umask 007 && ${shared}mkdir -p ${cwd} && cd ${cwd} && export HOME=${cwd} && export PATH="$HOME/.local/bin:$PATH" NPM_CONFIG_PREFIX="$HOME/.local"; `;
}

function sharedLinkShell({ link }: { link: string }) {
    const quoted = shellQuote({ text: link });
    const parent = shellQuote({ text: link.replace(/\/[^/]+$/, "") });
    const target = shellQuote({ text: computerWorkspacePath({ absolute: link }) });

    return `{ [ -e ${quoted} ] || [ -L ${quoted} ] || { mkdir -p ${parent} && ln -s ${target} ${quoted}; }; } && `;
}
