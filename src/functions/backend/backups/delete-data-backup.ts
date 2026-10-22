import fs from "fs";
import path from "path";
import grabBackupArchiveDir from "@/src/utils/grab-backup-archive-dir";
import resolveDataBackupPath from "./resolve-data-backup-path";

type Params = {
    backup_name?: string;
};

/**
 * Deletes one whole-data archive. Only an existing archive's own file is
 * removed, never a path from the request.
 */
export default function deleteDataBackup({ backup_name }: Params) {
    const backup_path = resolveDataBackupPath({ backup_name });

    fs.rmSync(path.join(grabBackupArchiveDir(), path.basename(backup_path)), {
        force: true,
    });
}
