import { describe, expect, test } from "bun:test";
import timeUntil from "./time-until";

const now = Date.UTC(2026, 9, 19, 8, 30);

describe("timeUntil", () => {
    test("counts down in the largest whole unit", () => {
        expect(timeUntil({ at: now + 30 * 1000, now })).toBe("now");
        expect(timeUntil({ at: now - 5000, now })).toBe("now");
        expect(timeUntil({ at: now + 5 * 60 * 1000, now })).toBe("in 5m");
        expect(timeUntil({ at: now + 3 * 60 * 60 * 1000, now })).toBe("in 3h");
        expect(timeUntil({ at: now + 2 * 24 * 60 * 60 * 1000, now })).toBe("in 2d");
        expect(timeUntil({ at: now + 21 * 24 * 60 * 60 * 1000, now })).toBe("in 3w");
    });
});
