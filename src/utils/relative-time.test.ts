import { describe, expect, test } from "bun:test";
import relativeTime from "./relative-time";

const NOW = new Date("2026-10-18T10:45:00").getTime();

describe("relativeTime", () => {
    test("under a minute is now", () => {
        expect(relativeTime({ at: NOW - 30_000, now: NOW })).toBe("now");
    });

    test("future timestamps clamp to now", () => {
        expect(relativeTime({ at: NOW + 60_000, now: NOW })).toBe("now");
    });

    test("minutes and hours", () => {
        expect(relativeTime({ at: NOW - 2 * 60_000, now: NOW })).toBe("2m");
        expect(relativeTime({ at: NOW - 3 * 3_600_000, now: NOW })).toBe("3h");
    });

    test("within a week is the weekday", () => {
        const tuesday = new Date("2026-10-13T09:00:00").getTime();
        expect(relativeTime({ at: tuesday, now: NOW })).toBe("Tue");
    });

    test("weeks and years", () => {
        expect(relativeTime({ at: NOW - 21 * 86_400_000, now: NOW })).toBe(
            "3w",
        );
        expect(relativeTime({ at: NOW - 800 * 86_400_000, now: NOW })).toBe(
            "2y",
        );
    });
});
