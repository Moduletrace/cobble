import { spawn } from "node:child_process";
import commandArgv from "./command-argv";
import type { RunUser } from "./run-user-for";
import workerEnv from "./worker-env";

/**
 * Writes the bytes (read from its input) to a temporary file beside the
 * target, then renames it over, creating the folders first.
 */
const WriteScript = `
const fs = require("fs"), path = require("path");
const [file, mode] = [process.argv[1], parseInt(process.argv[2], 8)];
const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temp = file + ".cobble-" + process.pid + "-" + Date.now();
    fs.writeFileSync(temp, Buffer.concat(chunks), { mode });
    fs.chmodSync(temp, mode);
    fs.renameSync(temp, file);
});
`;

/**
 * Writes a whole file as a worker's account, by a process running as it,
 * so its permissions decide where it may write: never as root, which
 * would follow a link the worker left in its folder to anywhere.
 */
export default function writeFileAs({ run_user, file, bytes, mode }: { run_user: RunUser; file: string; bytes: Buffer; mode: number }) {
    return new Promise<void>((resolve, reject) => {
        const quoted = (text: string) => `'${text.replaceAll("'", `'\\''`)}'`;
        const argv = commandArgv({
            command: `exec ${quoted(process.execPath)} -e ${quoted(WriteScript)} ${quoted(file)} ${mode.toString(8)}`,
            as: { uid: run_user.uid, gid: run_user.gid },
        });
        const child = spawn(argv.file, argv.args, { cwd: "/", env: workerEnv({ run_user }), stdio: ["pipe", "ignore", "pipe"] });
        const errors: Buffer[] = [];
        const timer = setTimeout(() => child.kill("SIGKILL"), 60_000);

        child.stderr?.on("data", (chunk) => errors.push(chunk));
        child.on("error", (error) => {
            clearTimeout(timer);
            reject(error);
        });
        child.on("exit", (code) => {
            clearTimeout(timer);

            if (code == 0) return resolve();

            const text = Buffer.concat(errors).toString("utf8");
            const reason = /EACCES|EPERM/.test(text)
                ? "permission denied"
                : text.match(/Error: ([^\n]+)/)?.[1] || `exit ${code}`;

            reject(new Error(`Couldn't write ${file}: ${reason}`));
        });

        child.stdin?.end(bytes);
    });
}
