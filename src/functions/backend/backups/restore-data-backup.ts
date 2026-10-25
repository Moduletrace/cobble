import fs from "fs";
import os from "os";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import writeDataBackupArchive from "./write-data-backup-archive";
import resolveDataBackupPath from "./resolve-data-backup-path";

export type DataBackupRestoreResult = {
    /**
     * The archive taken of the data as it was before the restore, so the
     * restore itself can be undone.
     */
    safety_name: string;
    restored_name: string;
};

type Params = {
    backup_name?: string;
};

type RootParams = {
    /**
     * Where the archive was extracted to.
     */
    staging_dir: string;
};

/**
 * The single folder an archive holds its data in (its root folder, named
 * after the archive when it was made). An archive with no single root
 * folder, or with loose files beside it, isn't one of ours.
 */
function findArchiveRoot({ staging_dir }: RootParams) {
    const entries = fs.readdirSync(staging_dir);
    const folders = entries.filter((entry) =>
        fs.statSync(path.join(staging_dir, entry)).isDirectory(),
    );

    const [folder] = folders;

    if (entries.length != 1 || !folder) {
        throw new Error(
            `The archive has no single root folder: it isn't a Cobble data archive`,
        );
    }

    return path.join(staging_dir, folder);
}

/**
 * Replaces the whole `DATA_DIR` with the contents of a data archive:
 * the database, media, computer homes, bot and workspace files, and the
 * database snapshots in `db/.backups` (which the archive's own overwrite,
 * so the restore is one consistent set).
 *
 * The archive is read into a temporary directory on the same volume
 * first, must hold one root folder with a database in it, and nothing on
 * disk is touched before that passes. A fresh archive of the current data
 * is taken as a safety copy, then the data directory is emptied (the
 * database snapshots included) and filled from the archive.
 *
 * Runs only inside `startDataBackupRun`, which holds the backup run lock
 * for it (taking it again here would refuse every restore).
 *
 * The caller restarts the process afterwards: the open SQLite handle still
 * points at the replaced file, so nothing may keep reading it.
 */
export default async function restoreDataBackup({
    backup_name,
}: Params): Promise<DataBackupRestoreResult> {
    const { DATA_DIR } = grabDirNames();
    const archive_path = resolveDataBackupPath({ backup_name });
    const archive_name = path.basename(archive_path);
    const staging_dir = fs.mkdtempSync(
        path.join(os.tmpdir(), "cobble-restore-"),
    );

    try {
        const extract = Bun.spawn(
            ["tar", "-xzf", archive_path, "-C", staging_dir],
            {
                cwd: process.cwd(),
                env: process.env,
                stdin: "ignore",
                stdout: "pipe",
                stderr: "pipe",
            },
        );

        const [stdout, stderr, exit_code] = await Promise.all([
            new Response(extract.stdout).text(),
            new Response(extract.stderr).text(),
            extract.exited,
        ]);

        if (exit_code !== 0) {
            throw new Error(
                stderr.trim() ||
                    stdout.trim() ||
                    `tar failed (exit ${exit_code})`,
            );
        }

        // The archive's own name may differ from its file name: an
        // upload is saved under a fresh timestamp. Its one root
        // folder is what holds the data, so find it rather than
        // assume it matches.
        const source_dir = findArchiveRoot({ staging_dir });

        if (!fs.existsSync(path.join(source_dir, "db"))) {
            throw new Error(
                `The archive has no database, so nothing was restored`,
            );
        }

        // The archive's snapshots would otherwise vanish with the
        // current ones, so the safety copy is taken before them.
        const safety = await writeDataBackupArchive();

        // Everything goes, the snapshots in `db/.backups` included:
        // the archive's own set replaces them.
        for (const entry of fs.readdirSync(DATA_DIR)) {
            fs.rmSync(path.join(DATA_DIR, entry), {
                recursive: true,
                force: true,
            });
        }

        for (const entry of fs.readdirSync(source_dir)) {
            fs.cpSync(
                path.join(source_dir, entry),
                path.join(DATA_DIR, entry),
                { recursive: true, force: true },
            );
        }

        return {
            safety_name: safety.name,
            restored_name: archive_name,
        };
    } finally {
        fs.rmSync(staging_dir, { recursive: true, force: true });
    }
}
