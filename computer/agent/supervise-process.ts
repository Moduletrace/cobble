import { spawn, type ChildProcess } from "node:child_process";
import log from "./log";

export type SupervisedExit = {
    code: number | null;
    signal: NodeJS.Signals | null;
    /**
     * How long it ran.
     */
    uptime_ms: number;
    /**
     * The end of what it printed.
     */
    tail: string;
};

type Params = {
    name: string;
    command: string;
    /**
     * Read again before each start, so a restart can change them.
     */
    args: () => string[];
    env: () => NodeJS.ProcessEnv;
    cwd?: string;
    uid?: number;
    gid?: number;
    onStart?: (params: { pid: number }) => void;
    onExit?: (params: SupervisedExit) => void;
};

export type Supervised = {
    pid: () => number | undefined;
    stop: (params: { grace_ms: number }) => Promise<void>;
};

const TailBytes = 4000;

/**
 * Runs a long-lived child and starts it again whenever it exits, waiting
 * longer each time it dies young (0.5s doubling to 10s, back to 0.5s after
 * it ran for 30s). It runs in its own process group, so a stop reaches
 * everything it started: TERM, then KILL after `grace_ms`.
 */
export default function superviseProcess({ name, command, args, env, cwd, uid, gid, onStart, onExit }: Params): Supervised {
    let child: ChildProcess | undefined;
    let stopped = false;
    let delay_ms = 500;
    let timer: NodeJS.Timeout | undefined;

    const start = () => {
        if (stopped) return;

        const started_at = Date.now();
        let tail = "";

        const keep = (chunk: Buffer) => {
            tail = (tail + chunk.toString("utf8")).slice(-TailBytes);
        };

        child = spawn(command, args(), {
            cwd,
            env: env(),
            uid,
            gid,
            detached: true,
            stdio: ["ignore", "pipe", "pipe"],
        });

        child.stdout?.on("data", keep);
        child.stderr?.on("data", keep);

        child.on("error", (error) => {
            log({ name, message: `couldn't start: ${error.message}` });
        });

        child.on("exit", (code, signal) => {
            const uptime_ms = Date.now() - started_at;

            child = undefined;
            onExit?.({ code, signal, uptime_ms, tail });

            if (stopped) return;

            delay_ms = uptime_ms > 30_000 ? 500 : Math.min(delay_ms * 2, 10_000);
            log({ name, message: `exited (${signal || code}) after ${Math.round(uptime_ms / 1000)}s; starting again in ${delay_ms}ms` });
            timer = setTimeout(start, delay_ms);
        });

        if (child.pid) onStart?.({ pid: child.pid });
    };

    start();

    return {
        pid: () => child?.pid,
        stop: async ({ grace_ms }) => {
            stopped = true;
            clearTimeout(timer);

            const running = child;

            if (!running?.pid) return;

            const exited = new Promise<void>((resolve) => running.once("exit", () => resolve()));

            killGroup({ pid: running.pid, signal: "SIGTERM" });

            const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), grace_ms));

            if ((await Promise.race([exited, timeout])) == "timeout") {
                killGroup({ pid: running.pid, signal: "SIGKILL" });
                await exited;
            }
        },
    };
}

/**
 * Signals a whole process group, ignoring one that's already gone.
 */
export function killGroup({ pid, signal }: { pid: number; signal: NodeJS.Signals }) {
    try {
        process.kill(-pid, signal);
    } catch {
        try {
            process.kill(pid, signal);
        } catch {}
    }
}
