import { describe, expect, test } from "bun:test";
import nextCronRun from "./next-cron-run";

const from = Date.UTC(2026, 9, 19, 8, 30);

describe("nextCronRun", () => {
    test("finds the next run in UTC", () => {
        expect(nextCronRun({ schedule: "0 9 * * *", from })).toBe(Date.UTC(2026, 9, 19, 9, 0));
        expect(nextCronRun({ schedule: "@daily", from })).toBe(Date.UTC(2026, 9, 20, 0, 0));
    });

    test("is null when the schedule never runs", () => {
        expect(nextCronRun({ schedule: "0 0 30 2 *", from })).toBeNull();
    });

    test("rejects invalid expressions", () => {
        expect(() => nextCronRun({ schedule: "every morning", from })).toThrow("isn't a valid schedule");
    });

    test("rejects schedules that run too often when asked", () => {
        expect(() => nextCronRun({ schedule: "* * * * *", from, check_interval: true })).toThrow("runs too often");
        expect(nextCronRun({ schedule: "* * * * *", from })).toBe(Date.UTC(2026, 9, 19, 8, 31));
        expect(nextCronRun({ schedule: "*/15 * * * *", from, check_interval: true })).toBe(Date.UTC(2026, 9, 19, 8, 45));
    });
});
