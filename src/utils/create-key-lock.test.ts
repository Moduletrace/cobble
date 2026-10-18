import { describe, expect, test } from "bun:test";
import createKeyLock from "./create-key-lock";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("createKeyLock", () => {
    test("runs tasks with the same key one at a time, in order", async () => {
        const lock = createKeyLock();
        const events: string[] = [];

        const job = (name: string, ms: number) =>
            lock.run({
                key: 1,
                task: async () => {
                    events.push(`${name}:start`);
                    await wait(ms);
                    events.push(`${name}:end`);
                    return name;
                },
            });

        const results = await Promise.all([job("a", 20), job("b", 1)]);

        expect(results).toEqual(["a", "b"]);
        expect(events).toEqual(["a:start", "a:end", "b:start", "b:end"]);
        expect(lock.size()).toBe(0);
    });

    test("runs different keys side by side", async () => {
        const lock = createKeyLock();
        const events: string[] = [];

        await Promise.all([
            lock.run({
                key: "x",
                task: async () => {
                    events.push("x:start");
                    await wait(20);
                    events.push("x:end");
                },
            }),
            lock.run({
                key: "y",
                task: async () => {
                    events.push("y:start");
                    events.push("y:end");
                },
            }),
        ]);

        expect(events.indexOf("y:end")).toBeLessThan(events.indexOf("x:end"));
    });

    test("a failing task doesn't block the next one", async () => {
        const lock = createKeyLock();

        const failed = lock.run({
            key: 1,
            task: async () => {
                throw new Error("boom");
            },
        });
        const next = lock.run({ key: 1, task: async () => "ok" });

        expect(failed).rejects.toThrow("boom");
        expect(await next).toBe("ok");
    });
});
