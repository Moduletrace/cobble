import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import scheduledRunRetryAt from "./scheduled-run-retry-at";

describe("scheduledRunRetryAt", () => {
    test("waits the retry delay after the first failure", () => {
        expect(scheduledRunRetryAt({ attempts: 1, now: 0 })).toBe(AppData.ScheduledRunRetryMs);
    });

    test("doubles after each failure", () => {
        expect(scheduledRunRetryAt({ attempts: 2, now: 0 })).toBe(AppData.ScheduledRunRetryMs * 2);
        expect(scheduledRunRetryAt({ attempts: 3, now: 0 })).toBe(AppData.ScheduledRunRetryMs * 4);
    });

    test("treats no attempts as the first", () => {
        expect(scheduledRunRetryAt({ attempts: 0, now: 10 })).toBe(10 + AppData.ScheduledRunRetryMs);
    });
});
