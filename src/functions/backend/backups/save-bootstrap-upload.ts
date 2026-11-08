import path from "path";
import AppError from "@/src/utils/app-error";
import grabDbBackupDir from "./grab-db-backup-dir";
import saveUploadedDbBackup from "./save-uploaded-db-backup";
import saveUploadedDataBackup from "./save-uploaded-data-backup";
import assertDbHasUsers from "./assert-db-has-users";
import deleteDbBackup from "./delete-db-backup";

type Params = {
    file: File;
};

export type BootstrapUploadKind = "database" | "archive";

export type BootstrapUpload = {
    kind: BootstrapUploadKind;
    /**
     * The name it was saved under: a database snapshot, or a data
     * archive.
     */
    backup_name: string;
};

const SQLITE_HEADER = "SQLite format 3\0";

/**
 * Saves the file a new install is bootstrapped from, telling the two
 * kinds apart by their first bytes rather than the file name: a SQLite
 * database (a snapshot downloaded from Settings > Backups) goes to the
 * database snapshots, a gzip (a whole-data archive) to the archives. A
 * database with no accounts is refused and removed again. Anything else
 * is refused before it's written.
 */
export default async function saveBootstrapUpload({
    file,
}: Params): Promise<BootstrapUpload> {
    if (!file.size) {
        throw new AppError(`The uploaded file is empty`);
    }

    const head = await file.slice(0, SQLITE_HEADER.length).text();

    if (head === SQLITE_HEADER) {
        const backup_name = await saveUploadedDbBackup({ file });

        try {
            assertDbHasUsers({
                db_path: path.join(grabDbBackupDir(), backup_name),
            });
        } catch (error) {
            deleteDbBackup({ backup_name });
            throw error;
        }

        return { kind: "database", backup_name };
    }

    const bytes = new Uint8Array(await file.slice(0, 2).arrayBuffer());

    if (bytes[0] == 0x1f && bytes[1] == 0x8b) {
        return {
            kind: "archive",
            backup_name: await saveUploadedDataBackup({ file }),
        };
    }

    throw new AppError(
        `Only a SQLite database file or a whole-data .tar.gz archive can be restored`,
    );
}
