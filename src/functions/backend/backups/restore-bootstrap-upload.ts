import restoreDbBackup from "./restore-db-backup";
import restoreDataBackup from "./restore-data-backup";
import restartApp from "./restart-app";
import queueBootLog from "./queue-boot-log";
import type { BootstrapUpload } from "./save-bootstrap-upload";
import type { LogEventParams } from "@/src/functions/backend/logger";

type Params = {
    upload: BootstrapUpload;
    /**
     * What the restored install's log should say about it, written once
     * the app is back up.
     */
    log_entry: LogEventParams;
};

/**
 * Puts a saved bootstrap upload in place, then restarts the app: a
 * database file replaces the database (`bun-sqlite import`, as Settings >
 * Backups does), a data archive replaces the whole data volume. Either
 * way the open SQLite handle still points at the old file, so the process
 * comes back up on the new one (and the entrypoint brings an older
 * database's schema up to date).
 *
 * Runs only inside `startDataBackupRun`, which holds the backup run lock.
 * Resolves to the name restored.
 */
export default async function restoreBootstrapUpload({
    upload,
    log_entry,
}: Params) {
    if (upload.kind == "database") {
        await restoreDbBackup({ backup_name: upload.backup_name });
    } else {
        await restoreDataBackup({ backup_name: upload.backup_name });
    }

    queueBootLog({ entry: log_entry });
    restartApp();

    return upload.backup_name;
}
