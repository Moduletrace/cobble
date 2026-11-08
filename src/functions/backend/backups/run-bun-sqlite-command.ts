import withBackupRunLock from "./with-backup-run-lock";
import spawnBunSQLiteCommand from "./spawn-bun-sqlite-command";

type Params = {
    args: string[];
};

/**
 * Runs a `bun-sqlite` CLI command (same as `bunx bun-sqlite ...`). Only one
 * backup or restore runs at a time so a backup, a restore and a whole-data
 * archive never overlap.
 */
export default async function runBunSQLiteCommand({ args }: Params) {
    return await withBackupRunLock({
        task: () => spawnBunSQLiteCommand({ args }),
    });
}
