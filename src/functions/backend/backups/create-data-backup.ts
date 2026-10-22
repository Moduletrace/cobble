import withBackupRunLock from "./with-backup-run-lock";
import writeDataBackupArchive from "./write-data-backup-archive";

/**
 * Archives the whole `DATA_DIR` (database, media, computer homes, bot and
 * workspace files, MCP installs) into `BACKUP_ARCHIVE_DIR` as
 * `cobble-data-{timestamp}.tar.gz`, then keeps only the newest
 * `AppData.DataBackupsKept`. Every entry sits under one root folder named
 * after the archive (`cobble-data-{timestamp}/`), so extracting it lands
 * one folder, never a heap of files in the current directory. The
 * database's own snapshots in `db/.backups` are inside `DATA_DIR`, so they
 * ride along and are left alone on disk.
 *
 * The archive is a filesystem copy of a live volume, so the SQLite file
 * inside it is only as consistent as the moment tar read it; a consistent
 * database snapshot is what the `db/.backups` list is for. Restoring a
 * whole-data archive is `restoreDataBackup` (`restore-data-backup.ts`).
 */
export default async function createDataBackup() {
    return await withBackupRunLock({ task: writeDataBackupArchive });
}
