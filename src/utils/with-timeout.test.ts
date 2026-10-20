import { describe, expect, test } from "bun:test";
import TaskTimeoutError from "./task-timeout-error";
import withTimeout from "./with-timeout";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("withTimeout", () => {
    test("returns the task's result", async () => {
        const result = await withTimeout({
            timeout_ms: 100,
            task: async () => "done",
        });

        expect(result).toBe("done");
    });

    test("stops a task that runs past its deadline", async () => {
        const error = await withTimeout({
            timeout_ms: 10,
            message: "Too slow.",
            task: () => wait(200),
        }).catch((e) => e);

        expect(error).toBeInstanceOf(TaskTimeoutError);
        expect(error instanceof TaskTimeoutError && error.message).toBe("Too slow.");
    });

    test("ends the wait even when the task ignores its signal", async () => {
        const error = await withTimeout({
            timeout_ms: 10,
            task: () => wait(200),
        }).catch((e) => e);

        expect(error).toBeInstanceOf(TaskTimeoutError);
    });

    test("aborts the task's signal on the deadline", async () => {
        let aborted = false;

        await withTimeout({
            timeout_ms: 10,
            task: async (task_signal) => {
                task_signal.addEventListener("abort", () => {
                    aborted = true;
                });

                await wait(50);
            },
        }).catch(() => {});

        expect(aborted).toBe(true);
    });

    test("passes the caller's cancellation through", async () => {
        const controller = new AbortController();
        let aborted = false;
        let started: () => void = () => {};
        const running_task = new Promise<void>((resolve) => {
            started = resolve;
        });

        const running = withTimeout({
            timeout_ms: 1000,
            signal: controller.signal,
            task: async (task_signal) => {
                task_signal.addEventListener("abort", () => {
                    aborted = true;
                });

                started();
                await wait(200);
            },
        });

        await running_task;
        controller.abort();
        const error = await running.catch((e) => e);

        expect(error).toBeInstanceOf(Error);
        expect(aborted).toBe(true);
    });

    test("doesn't start a task when already cancelled", async () => {
        const controller = new AbortController();
        let started = false;

        controller.abort();

        const error = await withTimeout({
            timeout_ms: 100,
            signal: controller.signal,
            task: async () => {
                started = true;
            },
        }).catch((e) => e);

        expect(error).toBeInstanceOf(Error);
        expect(started).toBe(false);
    });
});
