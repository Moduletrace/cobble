import fs from "fs";
import path from "path";
import { AppData } from "@/src/data/app-data";
import type { DataBackup } from "@/src/types";
import grabBackupArchiveDir from "@/src/utils/grab-backup-archive-dir";

const DATA_BACKUP_NAME_REGEX = new RegExp(
    `^${AppData.DataBackupNamePrefix}(\\d+)\\.tar\\.gz$`,
);

/**
 * Lists the `cobble-data-{timestamp}.tar.gz` archives of the whole
 * `DATA_DIR`, newest first. Only finished files match: a run in progress
 * writes a `.part` name, so a half-written archive never shows up. The
 * database snapshots bun-sqlite writes into `db/.backups` never match
 * either, so the two lists stay apart.
 */
export default function grabDataBackups(): DataBackup[] {
    const archive_dir = grabBackupArchiveDir();

    return fs
        .readdirSync(archive_dir)
        .filter((name) => DATA_BACKUP_NAME_REGEX.test(name))
        .map((name) => {
            const stat = fs.statSync(path.join(archive_dir, name));
            const timestamp = Number(
                DATA_BACKUP_NAME_REGEX.exec(name)?.[1],
            );

            return {
                name,
                created_at: Number.isFinite(timestamp)
                    ? timestamp
                    : stat.mtimeMs,
                size: stat.size,
            };
        })
        .sort((a, b) => b.created_at - a.created_at);
}
