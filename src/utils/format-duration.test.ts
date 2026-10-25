import { describe, expect, test } from "bun:test";
import formatDuration from "./format-duration";

describe("formatDuration", () => {
    test("reads at every scale", () => {
        expect(formatDuration({ ms: 850 })).toBe("850ms");
        expect(formatDuration({ ms: 4200 })).toBe("4.2s");
        expect(formatDuration({ ms: 3000 })).toBe("3s");
        expect(formatDuration({ ms: 125_000 })).toBe("2m 5s");
        expect(formatDuration({ ms: 120_000 })).toBe("2m");
        expect(formatDuration({ ms: 3_780_000 })).toBe("1h 3m");
        expect(formatDuration({ ms: 7_200_000 })).toBe("2h");
    });

    test("is empty for nothing to show", () => {
        expect(formatDuration({ ms: null })).toBe("");
        expect(formatDuration({ ms: -5 })).toBe("");
        expect(formatDuration({ ms: Number.NaN })).toBe("");
    });
});
