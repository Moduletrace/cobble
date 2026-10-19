import { describe, expect, test } from "bun:test";
import describeCronJob from "./describe-cron-job";

describe("describeCronJob", () => {
    test("describes a running schedule", () => {
        expect(
            describeCronJob({
                cron_job: {
                    id: 3,
                    title: "Morning digest",
                    schedule: "0 9 * * MON-FRI",
                    enabled: 1,
                    next_run_at: Date.UTC(2026, 9, 20, 9),
                    run_count: 1,
                    workspace_name: "Launch",
                    computer_id: 2,
                },
            }),
        ).toBe(
            `#3 "Morning digest", \`0 9 * * MON-FRI\` (UTC), in the workspace Launch, on computer 2, next run 2026-10-20T09:00:00.000Z, 1 run so far`,
        );
    });

    test("describes a paused one-off with an error", () => {
        expect(
            describeCronJob({
                cron_job: {
                    id: 4,
                    title: "Remind me",
                    schedule: "30 14 21 10 *",
                    enabled: 0,
                    run_count: 0,
                    max_runs: 1,
                    last_error: "This bot has no access to that computer.",
                },
            }),
        ).toBe(
            `#4 "Remind me", \`30 14 21 10 *\` (UTC), in your own chat, paused, 0 of 1 runs so far, last error: This bot has no access to that computer.`,
        );
    });
});
