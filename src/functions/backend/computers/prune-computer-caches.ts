import fs from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import countComputerTaskJobs from "../db/bots-queue/count-computer-task-jobs";
import pruneComputerCacheFolders, { type PrunedCacheFolder } from "./prune-computer-cache-folders";

/**
 * Clears every computer's disposable caches (`pruneComputerCacheFolders`):
 * the ones pip, npm and bun write beside a run's work, Python's bytecode,
 * and every Chrome profile's caches.
 *
 * A computer's folders sit on the data volume, so this is what keeps them
 * from growing with what a bot's tools left behind: one install held 2.4 GB
 * there against 178 MB of bot files. A computer with a task queued or
 * running is skipped: it may be installing into one of those caches right
 * now. Ids that aren't a computer's own folder (`prune-computer-homes`'
 * moved-aside homes) are left alone.
 */
export default async function pruneComputerCaches(): Promise<PrunedCacheFolder[]> {
    const { DATA_DIR } = grabDirNames();
    const computers_dir = path.join(DATA_DIR, AppData.ComputerDataDir);
    const profiles_dir = path.join(DATA_DIR, AppData.ComputerBrowserDataDir);
    const pruned: PrunedCacheFolder[] = [];

    for (const entry of await readDirectories(computers_dir)) {
        if (!/^\d+$/.test(entry.name)) continue;

        const busy = await countComputerTaskJobs({ computer_id: Number(entry.name) });

        if (busy > 0) continue;

        pruned.push(
            ...(await pruneComputerCacheFolders({
                computer_dir: path.join(computers_dir, entry.name),
                profile_dir: path.join(profiles_dir, entry.name),
            })),
        );
    }

    return pruned;
}

async function readDirectories(dir: string) {
    return (await readEntries(dir)).filter((entry) => entry.isDirectory());
}

async function readEntries(dir: string) {
    return await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
}