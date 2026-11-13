import { describe, expect, test } from "bun:test";
import minimumWait from "./minimum-wait";

const wait = (ms: number) =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });

describe("minimumWait", () => {
    test("holds the floor under work that finishes at once", async () => {
        const started = Date.now();

        await minimumWait({ task: Promise.resolve(), minimum_ms: 30 });

        expect(Date.now() - started).toBeGreaterThanOrEqual(29);
    });

    test("adds nothing to work that already took longer", async () => {
        const started = Date.now();

        await minimumWait({ task: wait(40), minimum_ms: 30 });

        expect(Date.now() - started).toBeGreaterThanOrEqual(39);
        expect(Date.now() - started).toBeLessThan(150);
    });

    test("waits out the floor for work that failed, without throwing", async () => {
        const started = Date.now();

        await minimumWait({
            task: Promise.reject(new Error("the conversation didn't load")),
            minimum_ms: 30,
        });

        expect(Date.now() - started).toBeGreaterThanOrEqual(29);
    });
});