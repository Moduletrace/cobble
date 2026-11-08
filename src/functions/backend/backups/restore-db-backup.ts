import resolveDbBackupPath from "./resolve-db-backup-path";
import spawnBunSQLiteCommand from "./spawn-bun-sqlite-command";

type Params = {
    backup_name?: string;
};

/**
 * Restores a database snapshot from the backups directory. `bun-sqlite
 * restore` is an interactive picker, so this uses its non-interactive
 * equivalent, `bun-sqlite import <file>`, which snapshots the current
 * database first.
 *
 * The import runs in its own process and swaps in a new file, so this
 * process's open SQLite handle still points at the old one: the caller
 * restarts the app afterwards (`restartApp`), and nothing may be written
 * in between (a log entry goes through `queueBootLog`).
 *
 * Runs only inside `startDataBackupRun`, which holds the backup run lock
 * for it.
 */
export default async function restoreDbBackup({ backup_name }: Params) {
    const backup_path = resolveDbBackupPath({ backup_name });

    return await spawnBunSQLiteCommand({ args: ["import", backup_path] });
}
