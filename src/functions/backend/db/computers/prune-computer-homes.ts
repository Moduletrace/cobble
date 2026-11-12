import fs from "fs/promises";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import oldComputerHomeName from "./old-computer-home-name";

const DayMs = 24 * 60 * 60 * 1000;

/**
 * Deletes the folders `prepareComputerDataDir` moved aside, once they are
 * older than `AppData.ComputerOldHomeKeepDays` (`prune-computer-homes`):
 * a computer's whole old home, kept in case someone wants what it held,
 * then forgotten. Data backups leave them out
 * (`writeDataBackupArchive`), so nothing else ever removes them and they
 * only grow the data volume.
 *
 * Returns the folders it deleted.
 */
export default async function pruneComputerHomes() {
    const { DATA_DIR } = grabDirNames();
    const root = path.join(DATA_DIR, AppData.ComputerDataDir);
    const cutoff = Date.now() - AppData.ComputerOldHomeKeepDays * DayMs;
    const entries = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
    const deleted: string[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const stamp = oldComputerHomeName({ name: entry.name });

        if (!stamp) continue;

        const target = path.join(root, entry.name);

        /**
         * The name's timestamp, checked against the folder's own time too:
         * a folder still being written is never old enough.
         */
        const stats = await fs.stat(target).catch(() => null);

        if (!stats || Math.max(stamp, stats.mtimeMs) > cutoff) continue;

        await fs.rm(target, { recursive: true, force: true }).catch(() => {});

        deleted.push(entry.name);
    }

    return deleted;
}