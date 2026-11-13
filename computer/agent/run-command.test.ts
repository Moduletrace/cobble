import { describe, expect, test } from "bun:test";
import runCommand from "./run-command";

const base = {
    cwd: "/tmp",
    env: { PATH: process.env.PATH },
    timeout_seconds: 10,
    max_output_bytes: 1024,
};

describe("runCommand", () => {
    test("returns output in order and the exit code", async () => {
        const result = await runCommand({ ...base, command: "echo one; echo two >&2; exit 3" });

        expect(result.output).toBe("one\ntwo\n");
        expect(result.exit_code).toBe(3);
        expect(result.timed_out).toBe(false);
    });

    test("reads no input", async () => {
        const result = await runCommand({ ...base, command: "read -r line; echo \"got:$line:$?\"" });

        expect(result.output).toBe("got::1\n");
    });

    test("stops a command past its timeout, with its children", async () => {
        const started = Date.now();
        const result = await runCommand({ ...base, timeout_seconds: 1, command: "sleep 30 & sleep 30" });

        expect(result.timed_out).toBe(true);
        expect(result.exit_code).toBe(124);
        expect(Date.now() - started).toBeLessThan(5000);
    });

    test("doesn't wait for background work", async () => {
        const started = Date.now();
        const result = await runCommand({ ...base, command: "sleep 5 & echo started" });

        expect(result.output).toBe("started\n");
        expect(Date.now() - started).toBeLessThan(2000);
    });

    test("cuts long output", async () => {
        const result = await runCommand({ ...base, max_output_bytes: 10, command: "printf '%050d' 0" });

        expect(result.output.length).toBe(10);
        expect(result.truncated).toBe(true);
    });

    test("runs to the end with no time limit", async () => {
        const result = await runCommand({ ...base, timeout_seconds: null, command: "sleep 1; echo done" });

        expect(result.output).toBe("done\n");
        expect(result.exit_code).toBe(0);
        expect(result.timed_out).toBe(false);
    });

    test("is killed when aborted", async () => {
        const controller = new AbortController();

        setTimeout(() => controller.abort(), 200);

        const started = Date.now();
        const result = await runCommand({ ...base, signal: controller.signal, command: "sleep 30" });

        expect(result.exit_code).not.toBe(0);
        expect(Date.now() - started).toBeLessThan(3000);
    });
});
