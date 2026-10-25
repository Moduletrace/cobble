import fs from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabComputerDataDir from "./grab-computer-data-dir";

type Params = {
    computer_id: number | string;
    /**
     * A new computer: files already at its path (left by a deleted
     * computer with the same id, e.g. after a restore) are moved aside to
     * `<id>-<timestamp>` and kept, so it starts empty.
     */
    fresh?: boolean;
};

/**
 * Creates a computer's workspace directory (mounted at
 * `AppData.ComputerWorkspaceDir`), with its `bots` and `workspaces`
 * folders, owned by the sandbox's user so it can write there, and returns
 * its path. Docker would otherwise create a missing mount source owned by
 * root.
 *
 * A directory without the layout marker (`AppData.ComputerWorkspaceMarker`)
 * is a computer's whole home from before only the workspace was mounted:
 * it is moved aside to `<id>-home-<timestamp>` and kept on disk (left out
 * of data backups), so the computer starts with a clean workspace.
 */
export default async function prepareComputerDataDir({ computer_id, fresh }: Params) {
    const dir = grabComputerDataDir({ computer_id });
    const marker = path.join(dir, AppData.ComputerWorkspaceMarker);
    const existing = await fs.readdir(dir).catch(() => null);

    if (existing?.length) {
        if (fresh) {
            await fs.rename(dir, `${dir}-${Date.now()}`);
        } else if (!(await fs.stat(marker).catch(() => null))) {
            await fs.rename(dir, `${dir}${AppData.ComputerOldHomeSuffix}${Date.now()}`);
        }
    }

    for (const folder of [dir, path.join(dir, "bots"), path.join(dir, "workspaces")]) {
        await fs.mkdir(folder, { recursive: true });
        await chownToSandbox({ target: folder });
    }

    await fs.writeFile(marker, "", { flag: "a" });
    await chownToSandbox({ target: marker });

    return dir;
}

/**
 * Only root can hand a file to another user; a dev server running as that
 * user already owns it.
 */
async function chownToSandbox({ target }: { target: string }) {
    await fs.chown(target, AppData.ComputerUserUid, AppData.ComputerUserGid).catch(() => {});
}
