import { afterAll, describe, expect, mock, test } from "bun:test";
import HarnessError from "@/src/harness/harness-error";
import type { StorageToolContext } from "./storage-tool-context";

/**
 * A provider that never answers costs the whole request timeout, and a bot
 * that retries it waits the same span again: four attempts once took 29
 * minutes. The tool allows one timeout per run, then a plain report.
 */
let calls = 0;
let failure: unknown;

mock.module("@/src/harness/image/generate-image", () => ({
    default: async () => {
        calls += 1;
        throw failure;
    },
}));

const { default: generateImageTool } = await import("./generate-image-tool");

afterAll(() => {
    mock.restore();
});

const context: StorageToolContext = {
    user_id: 1,
    bot_id: 3,
    scopes: [{ scope: "bot", owner_id: 3 }],
};
const signal = new AbortController().signal;

describe("generate_image after a provider timeout", () => {
    test("stops the run's other attempts", async () => {
        calls = 0;
        failure = new HarnessError({
            message: "Example took too long to answer.",
            retryable: true,
            timed_out: true,
        });
        const tool = generateImageTool(context);

        await expect(tool.run({ args: { prompt: "draw a cat" }, signal })).rejects.toThrow(
            "Image generation isn't working",
        );
        await expect(tool.run({ args: { prompt: "draw a cat again" }, signal })).rejects.toThrow(
            "The image model timed out earlier in this run",
        );
        expect(calls).toBe(1);
    });

    test("a failure that isn't a timeout can be tried again", async () => {
        calls = 0;
        failure = new HarnessError({ message: "No image came back.", retryable: true });
        const tool = generateImageTool(context);

        await expect(tool.run({ args: { prompt: "draw a cat" }, signal })).rejects.toThrow();
        await expect(tool.run({ args: { prompt: "draw a cat again" }, signal })).rejects.toThrow();
        expect(calls).toBe(2);
    });
});