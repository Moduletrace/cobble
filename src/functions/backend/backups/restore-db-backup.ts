import resolveDbBackupPath from "./resolve-db-backup-path";
import runBunSQLiteCommand from "./run-bun-sqlite-command";

type Params = {
    backup_name?: string;
};

/**
 * Restores a database snapshot from the backups directory. `bun-sqlite
 * restore` is an interactive picker, so this uses its non-interactive
 * equivalent, `bun-sqlite import <file>`.
 */
export default async function restoreDbBackup({ backup_name }: Params) {
    const backup_path = resolveDbBackupPath({ backup_name });

    return await runBunSQLiteCommand({ args: ["import", backup_path] });
}
