import fs from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import { ComputerBrowserPreferences } from "@/src/data/computer-browser-preferences";
import grabComputerBrowserDir from "./grab-computer-browser-dir";

type Params = {
    computer_id: number | string;
    /**
     * A new computer: a profile already at its path (left by a deleted
     * computer with the same id) is moved aside to `<id>-<timestamp>` and
     * kept, so it starts signed out.
     */
    fresh?: boolean;
};

/**
 * Chrome's links saying which process holds a profile. One left by the
 * container being replaced would point at a process that's gone.
 */
const SingletonFiles = ["SingletonLock", "SingletonSocket", "SingletonCookie"];

/**
 * Creates a computer's browser profile directory (mounted at
 * `AppData.ComputerBrowserProfileDir`), owned by the sandbox's user, and
 * returns its path. A profile without preferences gets
 * `ComputerBrowserPreferences`; an existing one is left as Chrome saved it,
 * only rid of the links of the Chrome that ran before.
 */
export default async function prepareComputerBrowserDir({ computer_id, fresh }: Params) {
    const dir = grabComputerBrowserDir({ computer_id });
    const default_dir = path.join(dir, "Default");
    const preferences = path.join(default_dir, "Preferences");

    if (fresh && (await fs.readdir(dir).catch(() => null))?.length) {
        await fs.rename(dir, `${dir}-${Date.now()}`);
    }

    for (const folder of [dir, default_dir]) {
        await fs.mkdir(folder, { recursive: true });
        await chownToSandbox({ target: folder });
    }

    for (const name of SingletonFiles) {
        await fs.rm(path.join(dir, name), { force: true });
    }

    if (!(await fs.stat(preferences).catch(() => null))) {
        await fs.writeFile(preferences, JSON.stringify(ComputerBrowserPreferences));
        await chownToSandbox({ target: preferences });
    }

    return dir;
}

/**
 * Only root can hand a file to another user; a dev server running as that
 * user already owns it.
 */
async function chownToSandbox({ target }: { target: string }) {
    await fs.chown(target, AppData.ComputerUserUid, AppData.ComputerUserGid).catch(() => {});
}
