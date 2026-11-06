import { constants } from "node:fs";
import { open, readlink } from "node:fs/promises";
import type { RunUser } from "./run-user-for";

/**
 * Opens a file (or folder) for reading. For a worker it must turn out to
 * be inside the worker's own folders once open (its real path, read from
 * the open descriptor, so a link swapped in meanwhile changes nothing):
 * the agent reads as root, and a worker's link in its folder could point
 * anywhere. Returns null when there's nothing there or it's outside.
 */
export default async function openRunFile({ file, run_user }: { file: string; run_user: RunUser | null }) {
    /**
     * Never waits: a pipe someone left there would hold the open forever.
     */
    const handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK).catch(() => null);

    if (!handle || !run_user) return handle;

    const real = await readlink(`/proc/self/fd/${handle.fd}`).catch(() => "");
    const roots = [run_user.bot_dir, run_user.home, ...(run_user.workspace ? [run_user.workspace.dir] : [])];

    if (roots.some((root) => real == root || real.startsWith(`${root}/`))) return handle;

    await handle.close().catch(() => {});

    return null;
}
