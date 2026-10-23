import { describe, expect, test } from "bun:test";
import { abortRunningJob, registerJobAbort, unregisterJobAbort } from "./job-abort-registry";

describe("job-abort-registry", () => {
    test("aborts the job this process is running", () => {
        let aborted = false;

        registerJobAbort({ job_id: 101, abort: () => (aborted = true) });

        expect(abortRunningJob({ job_id: 101 })).toBe(true);
        expect(aborted).toBe(true);

        unregisterJobAbort({ job_id: 101 });
    });

    test("a job running in another process is not here, so it isn't reported as aborted", () => {
        expect(abortRunningJob({ job_id: 202 })).toBe(false);
    });

    test("a finished job is cleaned up, so its id can't abort a later one", () => {
        let aborted = false;

        registerJobAbort({ job_id: 303, abort: () => (aborted = true) });
        unregisterJobAbort({ job_id: 303 });

        expect(abortRunningJob({ job_id: 303 })).toBe(false);
        expect(aborted).toBe(false);
    });

    test("a numeric string id reaches the same entry, since a route may send one", () => {
        let aborted = false;

        registerJobAbort({ job_id: 404, abort: () => (aborted = true) });

        expect(abortRunningJob({ job_id: "404" })).toBe(true);
        expect(aborted).toBe(true);

        unregisterJobAbort({ job_id: 404 });
    });

    test("unregistering a job nobody registered is harmless", () => {
        expect(() => unregisterJobAbort({ job_id: 505 })).not.toThrow();
    });

    test("only one job is aborted at a time", () => {
        const aborted: number[] = [];

        registerJobAbort({ job_id: 606, abort: () => aborted.push(606) });
        registerJobAbort({ job_id: 707, abort: () => aborted.push(707) });

        abortRunningJob({ job_id: 606 });

        expect(aborted).toEqual([606]);

        unregisterJobAbort({ job_id: 606 });
        unregisterJobAbort({ job_id: 707 });
    });
});
