import withBackupRunLock from "./with-backup-run-lock";

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
        task: async () => {
            const proc = Bun.spawn(
                [process.execPath, "x", "bun-sqlite", ...args],
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
                        `bun-sqlite ${args[0]} failed (exit ${exit_code})`,
                );
            }

            return { stdout };
        },
    });
}
