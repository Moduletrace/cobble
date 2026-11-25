import { AppData } from "@/src/data/app-data";
import runComputerCommand from "@/src/functions/backend/computers/run-computer-command";
import grabComputerTarget from "@/src/functions/backend/db/computers/grab-computer-target";
import shellQuote from "@/src/utils/shell-quote";

export type ComputerDirectoryEntry = {
    name: string;
    kind: "file" | "folder";
    size: number;
    modified_at: number;
};

type Params = {
    computer_id: number | string;
    /**
     * The folder inside the computer's workspace, relative to its root, e.g.
     * `bots/14/users/1`. Empty for the root.
     */
    relative: string;
};

/**
 * One folder of a computer's workspace, read through its agent when the app
 * itself can't open the folder: a dev server running as a plain user can't
 * read a worker's folder (`cb-<bot>` owns it), while the agent runs as root
 * on the computer. Hidden entries are listed like any other, and symlinks
 * are left out, as the browser never follows them. Null when the computer
 * can't be reached or the folder isn't there.
 */
export default async function listComputerDirectory({ computer_id, relative }: Params) {
    const target = await grabComputerTarget({ computer_id });

    if (!target?.ready || target.connection != "docker") return null;

    const folder = relative ? `${AppData.ComputerWorkspaceDir}/${relative}` : AppData.ComputerWorkspaceDir;
    const command = `sudo -n find ${shellQuote({ text: folder })} -mindepth 1 -maxdepth 1 -printf '%y\\000%f\\000%s\\000%T@\\000' 2>/dev/null`;
    const result = await runComputerCommand({ computer: target, command, timeout_ms: 30_000 }).catch(() => null);

    if (!result || result.exit_code != 0) return null;

    return parseComputerDirectory({ output: result.output });
}

/**
 * The agent's `find -printf` answer, four NUL-separated fields an entry:
 * its type (`d` or `f`), name, size and modification time in seconds.
 * Anything else a folder holds (a symlink, a socket) is left out, and a
 * cut-off last entry (a truncated answer) is dropped whole.
 */
export function parseComputerDirectory({ output }: { output: string }) {
    const fields = output.split("\0");

    if (fields.at(-1) === "") fields.pop();

    const entries: ComputerDirectoryEntry[] = [];

    for (let index = 0; index + 3 < fields.length; index += 4) {
        const [type, name, size, modified] = fields.slice(index, index + 4);

        if (!name) continue;
        if (type != "d" && type != "f") continue;

        entries.push({
            name,
            kind: type == "d" ? "folder" : "file",
            size: type == "f" ? Number(size) || 0 : 0,
            modified_at: Math.round((Number(modified) || 0) * 1000),
        });
    }

    return entries;
}