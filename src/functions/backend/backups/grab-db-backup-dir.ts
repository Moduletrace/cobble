import path from "path";
import BunSQLiteConfig from "@/bun-sqlite.config";

/**
 * Absolute path of the bun-sqlite backups directory. Mirrors bun-sqlite's
 * own resolution: `{db_dir}/{db_backup_dir || ".backups"}`.
 */
export default function grabDbBackupDir() {
    return path.resolve(
        process.cwd(),
        BunSQLiteConfig.db_dir || "",
        BunSQLiteConfig.db_backup_dir || ".backups",
    );
}
