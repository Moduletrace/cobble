import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import killProcessTree from "./kill-process-tree";

const alive = (pid: number) => {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
};

const childrenOf = (pid: number): number[] => {
    try {
        return readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8").split(/\s+/).filter(Boolean).map(Number);
    } catch {
        return [];
    }
};

const hasProc = existsSync("/proc/self");

describe("killProcessTree (M12)", () => {
    (hasProc ? test : test.skip)("kills the shell and the children it started", async () => {
        const proc = Bun.spawn(["bash", "-c", "sleep 5 & sleep 5"], { stdout: "ignore", stderr: "ignore" });
        const pid = proc.pid;

        let kids: number[] = [];
        for (let i = 0; i < 50 && kids.length < 2; i++) {
            await new Promise((resolve) => setTimeout(resolve, 20));
            kids = childrenOf(pid);
        }
        expect(kids.length).toBeGreaterThanOrEqual(1);

        killProcessTree({ pid });
        await new Promise((resolve) => setTimeout(resolve, 50));

        expect(alive(pid)).toBe(false);
        for (const kid of kids) expect(alive(kid)).toBe(false);

        try {
            proc.kill("SIGKILL");
        } catch {
            // Already gone.
        }
    });

    test("a pid that doesn't exist is harmless", () => {
        expect(() => killProcessTree({ pid: 999999 })).not.toThrow();
    });
});
