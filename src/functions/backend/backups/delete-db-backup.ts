import fs from "fs";
import resolveDbBackupPath from "./resolve-db-backup-path";

type Params = {
    backup_name?: string;
};

/**
 * Deletes one database snapshot from `db/.backups`. Only an existing
 * snapshot's own file is removed, never a path from the request.
 */
export default function deleteDbBackup({ backup_name }: Params) {
    fs.rmSync(resolveDbBackupPath({ backup_name }), { force: true });
}
