import fs from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import { BrowserProfileCacheDirs } from "@/src/data/computer-cache-paths";

type Params = {
    /**
     * The volume's root, as `grabDirNames` gives it.
     */
    data_dir: string;
};

type AddExclusion = (segments: string[]) => void;

type ProfileParams = {
    dir: string;
    rel: string[];
    add: AddExclusion;
};

const ProfileCacheNames = new Set<string>(BrowserProfileCacheDirs);

/**
 * Every path under `DATA_DIR` a data archive leaves out, as tar members
 * (`./db/.backups`), which `writeDataBackupArchive` hands tar with
 * `--no-wildcards`: these are exact paths, never patterns, so a folder a
 * bot named `node_modules!` or `Cache*` never takes a real one with it.
 *
 * A data archive used to tar the whole volume with one exclusion, so an
 * install's archive grew to 2 GB: 2457 MB of computer workspaces (against
 * 178 MB of bot files), 993 MB of Chrome profile caches, 148 MB of
 * database snapshots and 15 MB of bun-sqlite's scratch space.
 *
 * What stays out and why:
 * - `AppData.ComputerDataDir`: a computer's workspace is that computer's
 *   own state, and the restore leaves it live rather than replacing it
 *   (`restoreDataBackup`), so archiving it only grew every archive. Its
 *   caches are also cleared in place (`pruneComputerCaches`).
 * - a Chrome profile's caches (`BrowserProfileCacheDirs`): the profile is
 *   kept for its logins, which are a few MB next to hundreds of MB of HTTP
 *   and code caches Chrome downloads again.
 * - `db/.backups`: Settings > Backups > Database's own list, not part of
 *   the data volume; a restore keeps the running install's snapshots.
 * - `.bun-sqlite`: bun-sqlite's own scratch space, written again on the
 *   next start.
 */
export default async function listArchiveExclusions({ data_dir }: Params): Promise<string[]> {
    const excluded: string[] = [];
    const add: AddExclusion = (segments) => excluded.push(`./${segments.join("/")}`);

    if (await exists(path.join(data_dir, AppData.ComputerDataDir))) add([AppData.ComputerDataDir]);

    for (const entry of await readDirectories(path.join(data_dir, AppData.ComputerBrowserDataDir))) {
        const rel = [AppData.ComputerBrowserDataDir, entry.name];

        await excludeBrowserProfile({ dir: path.join(data_dir, ...rel), rel, add });
    }

    if (await exists(path.join(data_dir, "db", ".backups"))) add(["db", ".backups"]);

    if (await exists(path.join(data_dir, ".bun-sqlite"))) add([".bun-sqlite"]);

    return excluded;
}

/**
 * A Chrome profile's caches, at its root and inside its `Default` (or
 * `Profile N`) folder. Cookies, logins, preferences, extensions and local
 * storage stay.
 */
async function excludeBrowserProfile({ dir, rel, add }: ProfileParams) {
    for (const entry of await readEntries(dir)) {
        if (ProfileCacheNames.has(entry.name)) {
            add([...rel, entry.name]);
            continue;
        }

        if (!entry.isDirectory()) continue;

        for (const inner of await readEntries(path.join(dir, entry.name))) {
            if (ProfileCacheNames.has(inner.name)) add([...rel, entry.name, inner.name]);
        }
    }
}

async function readDirectories(dir: string) {
    return (await readEntries(dir)).filter((entry) => entry.isDirectory());
}

/**
 * Reads a folder's entries without following a symlink (`withFileTypes`
 * reports the link itself), so a link inside a profile never leads the
 * walk out of the volume.
 */
async function readEntries(dir: string) {
    return await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
}

async function exists(target: string) {
    return Boolean(await fs.stat(target).catch(() => null));
}