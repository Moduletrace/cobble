import { describe, expect, test } from "bun:test";
import AppError from "@/src/utils/app-error";
import { BootId, grabDataBackupRun, startDataBackupRun } from "./data-backup-run";
import { isBackupRunning } from "./with-backup-run-lock";

function deferred() {
    let resolve!: (name: string) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<string>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("startDataBackupRun", () => {
    test("answers at once, then records the finished archive", async () => {
        const task = deferred();

        const run = startDataBackupRun({
            kind: "archive",
            task: () => task.promise,
        });

        expect(run.status).toBe("running");
        expect(run.kind).toBe("archive");
        expect(run.boot_id).toBe(BootId);
        expect(isBackupRunning()).toBe(true);

        task.resolve("cobble-data-1.tar.gz");
        await settle();

        const done = grabDataBackupRun();
        expect(done.status).toBe("done");
        expect(done.name).toBe("cobble-data-1.tar.gz");
        expect(isBackupRunning()).toBe(false);
    });

    test("refuses a second run while one is going, before it starts", async () => {
        const task = deferred();
        let second_started = false;

        startDataBackupRun({ kind: "archive", task: () => task.promise });

        expect(() =>
            startDataBackupRun({
                kind: "restore",
                task: async () => {
                    second_started = true;
                    return "x";
                },
            }),
        ).toThrow(AppError);
        expect(second_started).toBe(false);

        task.resolve("cobble-data-2.tar.gz");
        await settle();
    });

    test("records a failure and frees the lock for the next run", async () => {
        const task = deferred();

        startDataBackupRun({ kind: "restore", task: () => task.promise });
        task.reject(new Error("tar: broken"));
        await settle();

        const failed = grabDataBackupRun();
        expect(failed.status).toBe("failed");
        expect(failed.kind).toBe("restore");
        expect(failed.error).toBe("tar: broken");
        expect(isBackupRunning()).toBe(false);

        const next = startDataBackupRun({
            kind: "archive",
            task: async () => "cobble-data-3.tar.gz",
        });
        expect(next.status).toBe("running");
        await settle();
        expect(grabDataBackupRun().status).toBe("done");
    });
});
