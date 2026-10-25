import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import { shellQuote } from "./download-computer-file";

/**
 * The shell that puts a command in the run's folder on the computer:
 * creates its folders (the user's in the bot's, and the workspace's shared
 * one), moves into the user's and makes it `HOME`, so `~` and every
 * relative path land there. Ends with `; `, ready to prefix a command.
 */
export default function computerDirsShell({ dirs }: { dirs: ComputerRunDirs }) {
    const cwd = shellQuote({ text: dirs.cwd });
    const folders = [dirs.cwd, ...(dirs.shared_dir ? [dirs.shared_dir] : [])]
        .map((dir) => shellQuote({ text: dir }))
        .join(" ");

    return `mkdir -p ${folders} && cd ${cwd} && export HOME=${cwd}; `;
}
