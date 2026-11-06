import { spawn } from "node:child_process";
import commandArgv from "./command-argv";
import { killGroup } from "./supervise-process";

type Params = {
    command: string;
    cwd: string;
    env: NodeJS.ProcessEnv;
    uid?: number;
    gid?: number;
    /**
     * Another account to run it as, with its groups (a worker's): `uid`
     * and `gid` are then left out.
     */
    as?: { uid: number; gid: number };
    timeout_seconds: number;
    max_output_bytes: number;
    /**
     * Aborting (the caller went away, the run was stopped) kills it.
     */
    signal?: AbortSignal;
};

export type CommandResult = {
    output: string;
    exit_code: number | null;
    timed_out: boolean;
    truncated: boolean;
};

/**
 * Runs one command in its own `bash -c`, in its own process group, with
 * no input (a prompt fails at once instead of waiting). stdout and stderr
 * come back together, in order, cut at `max_output_bytes`. Past its
 * timeout, or when aborted, the whole group gets TERM, then KILL 5s later.
 * It resolves when bash exits, not when every pipe closes, so work left in
 * the background (`nohup ... &`) keeps running without holding the call.
 */
export default function runCommand({
    command,
    cwd,
    env,
    uid,
    gid,
    as,
    timeout_seconds,
    max_output_bytes,
    signal,
}: Params): Promise<CommandResult> {
    return new Promise((resolve) => {
        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        let timed_out = false;
        let settled = false;

        const argv = commandArgv({ command, as });
        const child = spawn(argv.file, argv.args, {
            cwd,
            env,
            ...(as ? {} : { uid, gid }),
            detached: true,
            stdio: ["ignore", "pipe", "pipe"],
        });

        const keep = (chunk: Buffer) => {
            if (size >= max_output_bytes) {
                truncated = true;
                return;
            }

            const room = max_output_bytes - size;

            if (chunk.length > room) truncated = true;

            const part = chunk.length > room ? chunk.subarray(0, room) : chunk;

            chunks.push(part);
            size += part.length;
        };

        child.stdout?.on("data", keep);
        child.stderr?.on("data", keep);

        let kill_timer: NodeJS.Timeout | undefined;

        const stop = () => {
            if (!child.pid || child.exitCode != null) return;

            killGroup({ pid: child.pid, signal: "SIGTERM" });
            kill_timer = setTimeout(() => child.pid && killGroup({ pid: child.pid, signal: "SIGKILL" }), 5000);
        };

        const timer = setTimeout(() => {
            timed_out = true;
            stop();
        }, timeout_seconds * 1000);

        const onAbort = () => stop();

        signal?.addEventListener("abort", onAbort, { once: true });

        const finish = (exit_code: number | null) => {
            if (settled) return;

            settled = true;
            clearTimeout(timer);
            clearTimeout(kill_timer);
            signal?.removeEventListener("abort", onAbort);

            /**
             * A moment for what's still in the pipes, then let go of them:
             * a background job may hold them open for hours.
             */
            setTimeout(() => {
                child.stdout?.destroy();
                child.stderr?.destroy();
                resolve({
                    output: Buffer.concat(chunks).toString("utf8"),
                    exit_code: timed_out ? 124 : exit_code,
                    timed_out,
                    truncated,
                });
            }, 50);
        };

        child.on("error", (error) => {
            keep(Buffer.from(`${error.message}\n`));
            finish(127);
        });

        child.on("exit", (code, exit_signal) => finish(code ?? (exit_signal ? 128 + signalNumber({ signal: exit_signal }) : null)));
    });
}

function signalNumber({ signal }: { signal: NodeJS.Signals }) {
    return ({ SIGHUP: 1, SIGINT: 2, SIGKILL: 9, SIGTERM: 15 } as Record<string, number>)[signal] || 0;
}
