import { isInsideDir } from "./computer-work-dirs";
import computerWorkspacePath from "./computer-workspace-path";
import type { HostDirectoryDeleteTarget } from "./host-directory-delete-paths";

/**
 * A folder mounted from the host machine that asks before a delete, as the
 * run sees it and as the computer spells it.
 */
export type HostDirectoryGatedMount = {
    name: string;
    /** The mount's path in the computer's own spelling. */
    real_target: string;
    /** The same folder as the run sees it. */
    run_target: string;
};

/**
 * Which mounted folder a delete target is in, if any.
 *
 * A path is checked as the computer spells it, so both a worker's
 * `/home/cb-<bot>/workspace/...` and the real `/home/gem/workspace/...`
 * match. A move is only held when it would take the path out of the folder:
 * a rename inside it leaves the host with the same files.
 */
export default function gatedMountFor({
    target,
    mounts,
}: {
    target: HostDirectoryDeleteTarget;
    mounts: HostDirectoryGatedMount[];
}): HostDirectoryGatedMount | null {
    const real = computerWorkspacePath({ absolute: target.path });
    const mount = mounts.find((item) => isInsideDir({ parent: item.real_target, child: real }));

    if (!mount) return null;

    if (target.kind == "move" && target.destination) {
        const destination = computerWorkspacePath({ absolute: target.destination });

        if (isInsideDir({ parent: mount.real_target, child: destination })) return null;
    }

    return mount;
}