import fs from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import {
    BrowserProfileCacheDirs,
    ComputerBytecodeCacheDir,
    ComputerRunBrowserProfileDir,
    ComputerRunCacheEntries,
} from "@/src/data/computer-cache-paths";

export type PrunedCacheFolder = {
    dir: string;
    bytes: number;
};

type Params = {
    /**
     * One computer's folders: `DATA_DIR/computers/<id>`.
     */
    computer_dir: string;
    /**
     * Its browser profile: `DATA_DIR/computer-browsers/<id>`.
     */
    profile_dir: string;
};

const ProfileCacheNames = new Set<string>(BrowserProfileCacheDirs);

/**
 * Clears the caches in one computer's folders and browser profile
 * (`data/computer-cache-paths.ts` explains each list): what pip, npm and
 * bun write beside a run's work, Python's `__pycache__` anywhere below it,
 * a profile a bot started itself, and every Chrome profile cache. Never a
 * bot's work and never an install: `node_modules`, `~/.local` and `~/.pi`
 * stay, a run would otherwise lose its packages.
 *
 * Called only while nothing works on the computer (`pruneComputerCaches`
 * checks), so no run has a cache folder open.
 */
export default async function pruneComputerCacheFolders({
    computer_dir,
    profile_dir,
}: Params): Promise<PrunedCacheFolder[]> {
    const pruned: PrunedCacheFolder[] = [];

    for (const bot of await readDirectories(path.join(computer_dir, AppData.BotDataDir))) {
        const bot_dir = path.join(computer_dir, AppData.BotDataDir, bot.name);

        await pruneRunFolder({ dir: bot_dir, pruned });

        for (const user of await readDirectories(path.join(bot_dir, "users"))) {
            await pruneRunFolder({ dir: path.join(bot_dir, "users", user.name), pruned });
        }
    }

    for (const workspace of await readDirectories(path.join(computer_dir, AppData.WorkspaceDataDir))) {
        await pruneRunFolder({
            dir: path.join(computer_dir, AppData.WorkspaceDataDir, workspace.name),
            pruned,
        });
    }

    await pruneBrowserProfile({ dir: profile_dir, pruned });

    return pruned;
}

/**
 * One folder a run works in: its caches, and the caches made anywhere
 * below it.
 */
async function pruneRunFolder({ dir, pruned }: { dir: string; pruned: PrunedCacheFolder[] }) {
    for (const entry of ComputerRunCacheEntries) {
        await remove({ target: path.join(dir, entry), pruned });
    }

    await pruneNestedCaches({ dir, pruned });
}

async function pruneNestedCaches({ dir, pruned }: { dir: string; pruned: PrunedCacheFolder[] }) {
    for (const entry of await readDirectories(dir)) {
        const target = path.join(dir, entry.name);

        if (entry.name == ComputerBytecodeCacheDir) {
            await remove({ target, pruned });
            continue;
        }

        if (entry.name == ComputerRunBrowserProfileDir) {
            await pruneBrowserProfile({ dir: target, pruned });
            continue;
        }

        await pruneNestedCaches({ dir: target, pruned });
    }
}

/**
 * A Chrome profile's caches, at its root and inside its `Default` (or
 * `Profile N`) folder. Cookies, logins, preferences and extensions stay.
 */
async function pruneBrowserProfile({ dir, pruned }: { dir: string; pruned: PrunedCacheFolder[] }) {
    for (const entry of await readEntries(dir)) {
        const target = path.join(dir, entry.name);

        if (ProfileCacheNames.has(entry.name)) {
            await remove({ target, pruned });
            continue;
        }

        if (!entry.isDirectory()) continue;

        for (const inner of await readEntries(target)) {
            if (ProfileCacheNames.has(inner.name)) {
                await remove({ target: path.join(target, inner.name), pruned });
            }
        }
    }
}

/**
 * Deletes a folder (or a file) and notes how much it held. A missing one
 * is nothing to do.
 */
async function remove({ target, pruned }: { target: string; pruned: PrunedCacheFolder[] }) {
    const stats = await fs.lstat(target).catch(() => null);

    if (!stats) return;

    const bytes = stats.isDirectory() ? await folderBytes({ dir: target }) : stats.size;

    await fs.rm(target, { recursive: true, force: true }).catch(() => {});

    pruned.push({ dir: target, bytes });
}

async function folderBytes({ dir }: { dir: string }): Promise<number> {
    let total = 0;

    for (const entry of await readEntries(dir)) {
        const target = path.join(dir, entry.name);

        if (entry.isDirectory()) total += await folderBytes({ dir: target });
        else if (entry.isFile()) total += (await fs.stat(target).catch(() => null))?.size || 0;
    }

    return total;
}

async function readDirectories(dir: string) {
    return (await readEntries(dir)).filter((entry) => entry.isDirectory());
}

/**
 * Reads a folder's entries without following a symlink (`withFileTypes`
 * reports the link itself), so a bot's link elsewhere is never walked or
 * deleted through.
 */
async function readEntries(dir: string) {
    return await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
}