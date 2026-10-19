import { describe, expect, test } from "bun:test";
import routineSubtitle from "./routine-subtitle";

const now = Date.UTC(2026, 9, 19, 8, 30);

describe("routineSubtitle", () => {
    test("names the bot, workspace, schedule and next run", () => {
        expect(
            routineSubtitle({
                cron_job: {
                    bot_name: "Scout",
                    workspace_name: "Launch",
                    schedule: "0 9 * * *",
                    enabled: 1,
                    next_run_at: now + 30 * 60 * 1000,
                },
                now,
            }),
        ).toBe("Scout · Launch · 0 9 * * * UTC · next in 30m");
    });

    test("shows the last error instead, and no next run when paused", () => {
        expect(
            routineSubtitle({
                cron_job: { bot_name: "Scout", schedule: "@daily", enabled: 0, next_run_at: now, last_error: "Skipped a run." },
                now,
            }),
        ).toBe("Scout · @daily UTC · Skipped a run.");
        expect(routineSubtitle({ cron_job: { bot_name: "Scout", schedule: "@daily", enabled: 0, next_run_at: now }, now })).toBe(
            "Scout · @daily UTC",
        );
    });
});
