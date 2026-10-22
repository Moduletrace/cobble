import fs from "fs";
import os from "os";
import path from "path";

/**
 * Absolute path of the directory the whole-data archives are written to.
 * It is deliberately outside `DATA_DIR` (an archive must never contain
 * other archives) and outside the database's own `db/.backups`
 * directory, which keeps its bun-sqlite snapshots.
 *
 * `BACKUP_ARCHIVE_DIR` is the container's or install's setting (the
 * installer mounts `/backups-archives` from `$COBBLE_HOME/backups-archives`);
 * outside docker it falls back to `~/.cobble/backups`. It is a start-up
 * path like `DATA_DIR`, so it stays in the process environment and is
 * never an `envs` row.
 */
export default function grabBackupArchiveDir() {
    const dir =
        process.env.BACKUP_ARCHIVE_DIR ||
        path.join(os.homedir(), ".cobble", "backups");

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return path.resolve(dir);
}
