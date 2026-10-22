import path from "path";
import grabBackupArchiveDir from "@/src/utils/grab-backup-archive-dir";
import grabDataBackups from "./grab-data-backups";

type Params = {
    backup_name?: string;
};

/**
 * Resolves a data archive name from the request to its absolute path.
 * Only names of existing archives are accepted, so arbitrary paths can't
 * be read or written.
 */
export default function resolveDataBackupPath({ backup_name }: Params) {
    const backup = grabDataBackups().find((b) => b.name === backup_name);

    if (!backup) {
        throw new Error(`Archive not found`);
    }

    return path.join(grabBackupArchiveDir(), backup.name);
}
