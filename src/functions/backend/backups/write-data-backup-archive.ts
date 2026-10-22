import fs from "fs";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import grabBackupArchiveDir from "@/src/utils/grab-backup-archive-dir";
import grabDataBackups from "./grab-data-backups";

export type CreatedDataBackup = {
    name: string;
    path: string;
};

/**
 * Writes one archive of the whole `DATA_DIR` and prunes the old ones.
 * Callers already hold the backup run lock (`withBackupRunLock`), so a
 * restore can take its safety copy without deadlocking on it.
 */
export default async function writeDataBackupArchive(): Promise<CreatedDataBackup> {
    const { DATA_DIR } = grabDirNames();
    const archive_dir = grabBackupArchiveDir();
    const archive_name = `${AppData.DataBackupNamePrefix}${Date.now()}.tar.gz`;
    const archive_root = archive_name.replace(/\.tar\.gz$/, "");
    const archive_path = path.join(archive_dir, archive_name);
    const part_path = `${archive_path}.part`;

    try {
        const proc = Bun.spawn(
            [
                "tar",
                "-czf",
                part_path,
                // Every member (`.`, `./db`, `./media/x`, ...) is moved
                // under one folder named after the archive, so an extract
                // drops a single folder rather than a heap of files.
                // Two expressions: the root `.` itself and every `./`
                // member, so the whole archive sits under one folder named
                // after it and an extract drops a single folder.
                "--transform",
                `s,^\\.$,${archive_root},;s,^\\./,${archive_root}/,`,
                "-C",
                DATA_DIR,
                ".",
            ],
            {
                cwd: process.cwd(),
                env: process.env,
                stdin: "ignore",
                stdout: "pipe",
                stderr: "pipe",
            },
        );

        const [stdout, stderr, exit_code] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ]);

        if (exit_code !== 0) {
            throw new Error(
                stderr.trim() ||
                    stdout.trim() ||
                    `tar failed (exit ${exit_code})`,
            );
        }

        // Only a finished archive takes its real name, so a failed or
        // cut-off run is never listed or downloaded.
        fs.renameSync(part_path, archive_path);
    } finally {
        if (fs.existsSync(part_path)) {
            fs.rmSync(part_path, { force: true });
        }
    }

    const old = grabDataBackups().slice(AppData.DataBackupsKept);

    for (const backup of old) {
        fs.rmSync(path.join(archive_dir, backup.name), { force: true });
    }

    return {
        name: archive_name,
        path: archive_path,
    };
}
