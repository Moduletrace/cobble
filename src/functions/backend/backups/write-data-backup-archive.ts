import fs from "fs";
import os from "os";
import path from "path";
import { AppData } from "@/src/data/app-data";
import grabDirNames from "@/src/utils/grab-dir-names";
import grabBackupArchiveDir from "@/src/utils/grab-backup-archive-dir";
import grabDataBackups from "./grab-data-backups";
import listArchiveExclusions from "./list-archive-exclusions";

export type CreatedDataBackup = {
    name: string;
    path: string;
};

/**
 * Writes one archive of the install's data (`DATA_DIR`: database, media,
 * bot and workspace files, MCP installs, Chrome profiles) into
 * `BACKUP_ARCHIVE_DIR` and keeps only the newest
 * `AppData.DataBackupsKept`. Every entry sits under one root folder named
 * after the archive, so extracting it lands one folder. The SQLite file
 * inside is only as consistent as the moment tar read it; `db/.backups` is
 * for consistent snapshots.
 *
 * It leaves out what is rebuilt on demand or kept elsewhere
 * (`listArchiveExclusions`): a computer's own folders, Chrome profile
 * caches, the database snapshots and bun-sqlite's scratch space. Without
 * that, an install's 178 MB of bot files came with 2457 MB of computer
 * workspaces and 993 MB of browser caches, and every archive carried it
 * again.
 *
 * It takes no lock: callers run inside `startDataBackupRun`, which holds
 * the backup run lock (`withBackupRunLock`) for the whole run, so the
 * archive route and a restore's safety copy never take it twice.
 */
export default async function writeDataBackupArchive(): Promise<CreatedDataBackup> {
    const { DATA_DIR } = grabDirNames();
    const archive_dir = grabBackupArchiveDir();
    const archive_name = `${AppData.DataBackupNamePrefix}${Date.now()}.tar.gz`;
    const archive_root = archive_name.replace(/\.tar\.gz$/, "");
    const archive_path = path.join(archive_dir, archive_name);
    const part_path = `${archive_path}.part`;
    const excl_dir = fs.mkdtempSync(path.join(os.tmpdir(), "cobble-archive-"));
    const excl_path = path.join(excl_dir, "exclude.txt");

    try {
        const exclusions = await listArchiveExclusions({ data_dir: DATA_DIR });

        fs.writeFileSync(excl_path, exclusions.map((line) => `${line}\n`).join(""));

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
                // The exclusions are exact member paths
                // (`listArchiveExclusions`), never patterns: a folder a
                // bot named `node_modules!` or `Cache*` must not take a
                // real one with it.
                "--no-wildcards",
                `--exclude-from=${excl_path}`,
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

        fs.rmSync(excl_dir, { recursive: true, force: true });
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