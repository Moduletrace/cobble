import { describe, expect, test } from "bun:test";
import abortableSleep from "./abortable-sleep";

describe("abortableSleep", () => {
    test("waits", async () => {
        const started = Date.now();

        await abortableSleep({ ms: 20 });
        expect(Date.now() - started).toBeGreaterThanOrEqual(15);
    });

    test("stops at once when aborted", async () => {
        const controller = new AbortController();
        const started = Date.now();
        const wait = abortableSleep({ ms: 5000, signal: controller.signal });

        controller.abort(new Error("stop"));
        await expect(wait).rejects.toThrow("stop");
        expect(Date.now() - started).toBeLessThan(1000);
    });
});
