import { resolveComputerPath, type ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import { commandSegments, leadingCommand } from "./shell-command";

/**
 * The repositories a destructive command might touch, so the safety snapshot
 * covers each of them rather than only the run's working directory.
 *
 * A command can reach past its cwd with `git -C <dir> ...` or by changing
 * directory first (`cd <dir> && git ...`); snapshotting only the cwd would
 * save the wrong tree while the command discards another (M6). Every target
 * named that way is collected, resolved against the run's folders, and the
 * base cwd is always included. A target that resolves outside the folders is
 * skipped: the snapshot script itself exits quietly for anything that is not
 * a repository, so an extra candidate costs nothing.
 */
export default function gitSnapshotRoots({
    command,
    dirs,
    cwd,
}: {
    command: string;
    dirs: ComputerRunDirs;
    cwd?: string | null;
}): string[] {
    const base = cwd || dirs.cwd;
    const roots = new Set<string>([base]);

    const add = (requested: string) => {
        try {
            roots.add(resolveComputerPath({ path: requested, dirs }));
        } catch {
            // Outside the run's folders, or not a usable path: leave it out.
        }
    };

    for (const segment of commandSegments({ command })) {
        const leading = leadingCommand({ segment });

        if (!leading) continue;

        if (leading.program == "cd" && leading.args[0]) {
            add(leading.args[0]);
        }

        if (leading.program == "git") {
            for (let index = 0; index < leading.args.length; index++) {
                if (leading.args[index] == "-C" && leading.args[index + 1]) {
                    add(leading.args[index + 1]!);
                }
            }
        }
    }

    return [...roots];
}
