import path from "path";
import grabDbBackupDir from "./grab-db-backup-dir";
import grabDbBackups from "./grab-db-backups";

type Params = {
    backup_name?: string;
};

/**
 * Resolves a backup file name from the request to its absolute path. Only
 * names of existing backups are accepted, so arbitrary paths can't be read.
 */
export default function resolveDbBackupPath({ backup_name }: Params) {
    const backup = grabDbBackups().find((b) => b.name === backup_name);

    if (!backup) {
        throw new Error(`Backup not found`);
    }

    return path.join(grabDbBackupDir(), backup.name);
}
