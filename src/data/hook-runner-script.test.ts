import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { HookRunnerProtocol, HookRunnerScript, HookRunnerVersion } from "./hook-runner-script";

const root = mkdtempSync(path.join(tmpdir(), "hook-runner-"));
const bot_dir = path.join(root, "bots", "3");
const base = path.join(bot_dir, ".cobble", "hook-runners");
const ensure = path.join(base, "ensure.py");
const pids: number[] = [];

mkdirSync(base, { recursive: true });
writeFileSync(ensure, HookRunnerScript, { mode: 0o700 });

type Result = {
    id: number;
    pid: number | null;
    running: boolean;
    started_at: number | null;
    error: string | null;
};

type Output = { ok: boolean; runners: Result[]; error?: string };

type Wanted = { id: number; command?: string; cwd?: string; version?: string };

/**
 * Runs the keeper as the app does: writes the desired state, runs the
 * script, reads its one JSON line.
 */
function check({ runners, protocol = HookRunnerProtocol, restart = [] }: { runners: Wanted[]; protocol?: number; restart?: number[] }): Output {
    writeFileSync(
        path.join(base, "desired.json"),
        JSON.stringify({
            protocol,
            version: HookRunnerVersion,
            stop_ms: 500,
            log_max_bytes: 4096,
            restart,
            runners: runners.map((item) => ({
                id: item.id,
                command: item.command ?? "sleep 60",
                cwd: item.cwd ?? bot_dir,
                version: item.version ?? "v1",
            })),
        }),
    );
    const run = spawnSync("python3", [ensure], { encoding: "utf8", timeout: 30_000 });
    const lines = run.stdout.trim().split("\n").filter(Boolean);
    const line = lines[lines.length - 1];
    if (!line) throw new Error(`The keeper printed nothing: ${run.stderr}`);
    const output = JSON.parse(line) as Output;
    for (const item of output.runners) if (item.pid) pids.push(item.pid);

    return output;
}

function only(output: Output): Result {
    const [first] = output.runners;
    if (!first) throw new Error("The check said nothing about the runner.");
    return first;
}

function isAlive(pid: number) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

afterAll(() => {
    for (const pid of pids) {
        try {
            process.kill(-pid, "SIGKILL");
        } catch {
            try {
                process.kill(pid, "SIGKILL");
            } catch {}
        }
    }
    rmSync(root, { recursive: true, force: true });
});

describe("HookRunnerScript", () => {
    test("is valid Python that the app's interpreter can read", () => {
        const run = spawnSync(
            "python3",
            ["-c", `import ast, pathlib; ast.parse(pathlib.Path(${JSON.stringify(ensure)}).read_text())`],
            { encoding: "utf8" },
        );

        expect(run.status).toBe(0);
    });

    test("fills the protocol in, and leaves no placeholder", () => {
        expect(HookRunnerScript).not.toContain("PROTOCOL_PLACEHOLDER");
        expect(HookRunnerScript).toContain(`PROTOCOL = ${HookRunnerProtocol}`);
    });

    test("starts a runner, then leaves it alone", () => {
        const first = check({ runners: [{ id: 11 }] });
        const started = only(first);
        expect(first.ok).toBe(true);
        expect(started.running).toBe(true);
        expect(started.error).toBeNull();
        const pid = started.pid!;
        expect(isAlive(pid)).toBe(true);

        const again = only(check({ runners: [{ id: 11 }] }));
        expect(again.pid).toBe(pid);
        expect(again.started_at).toBe(started.started_at);
        expect(isAlive(pid)).toBe(true);
    });

    test("restarts a runner whose setup changed", () => {
        const old = only(check({ runners: [{ id: 12 }] })).pid!;

        const changed = only(check({ runners: [{ id: 12, version: "v2" }] }));
        const pid = changed.pid!;

        expect(pid).not.toBe(old);
        expect(isAlive(pid)).toBe(true);
        expect(isAlive(old)).toBe(false);
    });

    test("restarts a runner when asked, even unchanged", () => {
        const old = only(check({ runners: [{ id: 13 }] })).pid!;

        const restarted = only(check({ runners: [{ id: 13 }], restart: [13] }));

        expect(restarted.pid).not.toBe(old);
        expect(isAlive(old)).toBe(false);
    });

    test("stops what is no longer wanted and forgets its state", () => {
        const pid = only(check({ runners: [{ id: 14 }] })).pid!;

        const stopped = check({ runners: [{ id: 11 }] });

        expect(stopped.runners.some((item) => item.id == 14)).toBe(false);
        expect(isAlive(pid)).toBe(false);
        expect(() => readFileSync(path.join(base, "14.json"))).toThrow();
    });

    test("forgets the envs of a runner it stops, which can hold secrets", () => {
        writeFileSync(path.join(base, "20.env.json"), JSON.stringify({ WHATSAPP_TOKEN: "gone" }));

        check({ runners: [{ id: 11 }] });

        expect(() => readFileSync(path.join(base, "20.env.json"))).toThrow();
    });

    test("says why a runner that exits at once isn't running", () => {
        const exited = only(check({ runners: [{ id: 15, command: "echo no-config && exit 3" }] }));

        expect(exited.running).toBe(false);
        expect(exited.pid).toBeNull();
        expect(exited.error).toContain("It exited at once (code 3)");
        expect(exited.error).toContain("no-config");
    });

    test("says when the runner's folder isn't there", () => {
        const missing = only(check({ runners: [{ id: 16, cwd: path.join(bot_dir, "missing") }] }));

        expect(missing.error).toContain("Its folder isn't there");
    });

    test("refuses a protocol it doesn't know", () => {
        const output = check({ runners: [{ id: 17 }], protocol: HookRunnerProtocol + 1 });

        expect(output.ok).toBe(false);
        expect(output.error).toContain("don't match");
    });

    test("keeps the runner's own output in its log", () => {
        check({ runners: [{ id: 18, command: "echo hello-there && sleep 60" }] });

        expect(readFileSync(path.join(base, "18.log"), "utf8")).toContain("hello-there");
    });

    test("gives the runner the envs the app wrote for it", () => {
        writeFileSync(path.join(base, "19.env.json"), JSON.stringify({ WHATSAPP_TOKEN: "from-the-app" }));

        check({ runners: [{ id: 19, command: "echo token=$WHATSAPP_TOKEN && sleep 60" }] });

        expect(readFileSync(path.join(base, "19.log"), "utf8")).toContain("token=from-the-app");
    });
});