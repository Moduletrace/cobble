type Params = {
    args: string[];
};

/**
 * Runs a `bun-sqlite` CLI command (same as `bunx bun-sqlite ...`) without
 * taking the backup run lock: only for a caller that already holds it
 * (a task inside `startDataBackupRun`). Everyone else goes through
 * `runBunSQLiteCommand`.
 */
export default async function spawnBunSQLiteCommand({ args }: Params) {
    const proc = Bun.spawn([process.execPath, "x", "bun-sqlite", ...args], {
        cwd: process.cwd(),
        env: process.env,
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
    });

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
}
