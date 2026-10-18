type Params = {
    args: string[];
};

let is_running = false;

/**
 * Runs a `bun-sqlite` CLI command (same as `bunx bun-sqlite ...`). Only one
 * command runs at a time so a backup and a restore never overlap.
 */
export default async function runBunSQLiteCommand({ args }: Params) {
    if (is_running) {
        throw new Error(`Another backup or restore is already running`);
    }

    is_running = true;

    try {
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
    } finally {
        is_running = false;
    }
}
