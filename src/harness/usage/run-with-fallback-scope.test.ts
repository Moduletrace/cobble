import { describe, expect, test } from "bun:test";
import { grabHarnessUsageScope, runWithHarnessUsageScope } from "./harness-usage-scope";
import runWithFallbackScope from "./run-with-fallback-scope";

const owner = { user_id: 9, bot_id: 3, session_id: null, message_id: null, job_id: null };

describe("runWithFallbackScope", () => {
    test("the enclosing run keeps the work it already owns", async () => {
        const seen = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, job_id: 5 },
            task: () =>
                runWithFallbackScope({
                    scope: owner,
                    task: async () => grabHarnessUsageScope(),
                }),
        });

        expect(seen).toEqual({ user_id: 7, bot_id: 3, job_id: 5 });
    });

    test("work with no run is attributed to its owner", async () => {
        const seen = await runWithFallbackScope({
            scope: owner,
            task: async () => grabHarnessUsageScope(),
        });

        expect(seen).toEqual(owner);
    });

    test("nobody to charge leaves the work unattributed rather than failing", async () => {
        const seen = await runWithFallbackScope({
            scope: null,
            task: async () => grabHarnessUsageScope(),
        });

        expect(seen).toBeUndefined();
    });

    test("a scope with no user is not an owner", async () => {
        const seen = await runWithFallbackScope({
            scope: { ...owner, user_id: undefined },
            task: async () => grabHarnessUsageScope(),
        });

        expect(seen).toBeUndefined();
    });

    test("work that must be charged on its own overrides the enclosing run", async () => {
        const seen = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, job_id: 5 },
            task: () =>
                runWithFallbackScope({
                    scope: owner,
                    mode: "own",
                    task: async () => grabHarnessUsageScope(),
                }),
        });

        expect(seen).toEqual(owner);
    });

    test("the work's result is passed through", async () => {
        const result = await runWithFallbackScope({
            scope: owner,
            task: async () => "the answer",
        });

        expect(result).toBe("the answer");
    });

    test("a failure inside the work is not swallowed", async () => {
        expect(
            runWithFallbackScope({
                scope: owner,
                task: async () => {
                    throw new Error("the provider refused");
                },
            }),
        ).rejects.toThrow("the provider refused");
    });
});
