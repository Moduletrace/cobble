import { describe, expect, test } from "bun:test";
import { grabHarnessUsageScope, runWithHarnessUsageScope } from "./harness-usage-scope";

describe("harness usage scope", () => {
    test("nothing is attributed outside a run", () => {
        expect(grabHarnessUsageScope()).toBeUndefined();
    });

    test("a run's scope is visible to everything it calls", async () => {
        const scope = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, session_id: 11 },
            task: async () => grabHarnessUsageScope(),
        });

        expect(scope).toEqual({ user_id: 7, bot_id: 3, session_id: 11 });
    });

    test("a nested run keeps what the outer one knew", async () => {
        const scope = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, session_id: 11, job_id: 5 },
            task: () =>
                runWithHarnessUsageScope({
                    scope: { message_id: 42 },
                    task: async () => grabHarnessUsageScope(),
                }),
        });

        expect(scope).toEqual({
            user_id: 7,
            bot_id: 3,
            session_id: 11,
            job_id: 5,
            message_id: 42,
        });
    });

    test("a nested run overrides only what it sets", async () => {
        const scope = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, workspace_id: 9 },
            task: () =>
                runWithHarnessUsageScope({
                    scope: { bot_id: 4 },
                    task: async () => grabHarnessUsageScope(),
                }),
        });

        expect(scope).toEqual({ user_id: 7, bot_id: 4, workspace_id: 9 });
    });

    test("an undefined field leaves the outer value alone", async () => {
        const scope = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, job_id: 5 },
            task: () =>
                runWithHarnessUsageScope({
                    scope: { job_id: undefined, message_id: 42 },
                    task: async () => grabHarnessUsageScope(),
                }),
        });

        expect(scope).toEqual({ user_id: 7, bot_id: 3, job_id: 5, message_id: 42 });
    });

    test("a null field clears the outer value, since it means 'none'", async () => {
        const scope = await runWithHarnessUsageScope({
            scope: { user_id: 7, bot_id: 3, workspace_id: 9, job_id: 5 },
            task: () =>
                runWithHarnessUsageScope({
                    scope: { workspace_id: null, job_id: null },
                    task: async () => grabHarnessUsageScope(),
                }),
        });

        expect(scope).toEqual({ user_id: 7, bot_id: 3, workspace_id: null, job_id: null });
    });

    test("the scope is gone once the run returns", async () => {
        await runWithHarnessUsageScope({
            scope: { user_id: 7 },
            task: async () => undefined,
        });

        expect(grabHarnessUsageScope()).toBeUndefined();
    });

    test("two concurrent runs never see each other's scope", async () => {
        const [first, second] = await Promise.all([
            runWithHarnessUsageScope({
                scope: { user_id: 1 },
                task: async () => {
                    await Bun.sleep(5);
                    return grabHarnessUsageScope();
                },
            }),
            runWithHarnessUsageScope({
                scope: { user_id: 2 },
                task: async () => {
                    await Bun.sleep(1);
                    return grabHarnessUsageScope();
                },
            }),
        ]);

        expect(first).toEqual({ user_id: 1 });
        expect(second).toEqual({ user_id: 2 });
    });
});
