import { describe, expect, test } from "bun:test";
import readRunLimit from "./read-run-limit";
import { UnlimitedLimit } from "./run-limit";

const base = { fallback: 200, max: 1000 };

describe("readRunLimit", () => {
    test("uses a saved limit inside the allowed range", () => {
        expect(readRunLimit({ ...base, saved: "40" })).toBe(40);
        expect(readRunLimit({ ...base, saved: " 12 " })).toBe(12);
        expect(readRunLimit({ ...base, saved: "1000" })).toBe(1000);
    });

    test("reads no limit, however the install wrote it", () => {
        expect(readRunLimit({ ...base, saved: UnlimitedLimit })).toBe(UnlimitedLimit);
        expect(readRunLimit({ ...base, saved: " unlimited " })).toBe(UnlimitedLimit);
        expect(readRunLimit({ ...base, saved: "Unlimited" })).toBe(UnlimitedLimit);
        expect(readRunLimit({ ...base, fallback: UnlimitedLimit, saved: UnlimitedLimit })).toBe(UnlimitedLimit);
    });

    test("falls back when nothing was saved, which may be no limit", () => {
        expect(readRunLimit({ ...base, saved: undefined })).toBe(200);
        expect(readRunLimit({ ...base, saved: null })).toBe(200);
        expect(readRunLimit({ ...base, saved: "   " })).toBe(200);
        expect(readRunLimit({ fallback: UnlimitedLimit, max: 1000, saved: null })).toBe(UnlimitedLimit);
    });

    test("falls back when the saved limit can't drive a run", () => {
        expect(readRunLimit({ ...base, saved: "0" })).toBe(200);
        expect(readRunLimit({ ...base, saved: "-3" })).toBe(200);
        expect(readRunLimit({ ...base, saved: "abc" })).toBe(200);
        expect(readRunLimit({ ...base, saved: "12.5" })).toBe(200);
        expect(readRunLimit({ ...base, saved: "12steps" })).toBe(200);
        expect(readRunLimit({ ...base, saved: "1001" })).toBe(200);
    });

    test("falls back under the floor when one is given", () => {
        expect(readRunLimit({ fallback: 80000, max: 1000000, min: 20000, saved: "19999" })).toBe(80000);
        expect(readRunLimit({ fallback: 80000, max: 1000000, min: 20000, saved: "20000" })).toBe(20000);
    });
});