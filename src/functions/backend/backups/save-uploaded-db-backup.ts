import fs from "fs";
import path from "path";
import BunSQLiteConfig from "@/bun-sqlite.config";
import grabDbBackupDir from "./grab-db-backup-dir";

type Params = {
    file: File;
};

const SQLITE_HEADER = "SQLite format 3\0";

/**
 * Saves an uploaded SQLite database file into the backups directory under
 * the same `{db_name}-{timestamp}` name `bun-sqlite backup` uses, so it is
 * listed and pruned like any other backup. Returns the saved file name.
 */
export default async function saveUploadedDbBackup({ file }: Params) {
    if (!file.size) {
        throw new Error(`The uploaded backup file is empty`);
    }

    const header = await file.slice(0, SQLITE_HEADER.length).text();

    if (header !== SQLITE_HEADER) {
        throw new Error(`Only SQLite database files can be restored`);
    }

    const backup_dir = grabDbBackupDir();

    if (!fs.existsSync(backup_dir)) {
        fs.mkdirSync(backup_dir, { recursive: true });
    }

    const backup_name = `${BunSQLiteConfig.db_name}-${Date.now()}`;

    await Bun.write(path.join(backup_dir, backup_name), file);

    return backup_name;
}
