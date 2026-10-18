import fs from "fs";
import path from "path";
import BunSQLiteConfig from "@/bun-sqlite.config";
import type { DbBackup } from "@/src/types";
import grabDbBackupDir from "./grab-db-backup-dir";

/**
 * Lists the `{db_name}-{timestamp}` snapshots written by `bun-sqlite
 * backup`. Newest first.
 */
export default function grabDbBackups(): DbBackup[] {
    const backup_dir = grabDbBackupDir();
    const backup_name_regex = new RegExp(
        `^${BunSQLiteConfig.db_name}-\\d+$`,
    );

    if (!fs.existsSync(backup_dir)) {
        return [];
    }

    return fs
        .readdirSync(backup_dir)
        .filter((name) => backup_name_regex.test(name))
        .map((name) => {
            const stat = fs.statSync(path.join(backup_dir, name));
            const timestamp = Number(name.split("-").pop());

            return {
                name,
                is_file: stat.isFile(),
                created_at: Number.isFinite(timestamp)
                    ? timestamp
                    : stat.mtimeMs,
                size: stat.size,
            };
        })
        .filter((backup) => backup.is_file)
        .map(({ is_file, ...backup }) => backup)
        .sort((a, b) => b.created_at - a.created_at);
}
