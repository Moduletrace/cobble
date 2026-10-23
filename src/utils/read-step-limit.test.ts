import { describe, expect, test } from "bun:test";
import readStepLimit from "./read-step-limit";

const base = { fallback: 200, max: 1000 };

describe("readStepLimit", () => {
    test("uses a saved limit inside the allowed range", () => {
        expect(readStepLimit({ ...base, saved: "40" })).toBe(40);
        expect(readStepLimit({ ...base, saved: " 12 " })).toBe(12);
        expect(readStepLimit({ ...base, saved: "1" })).toBe(1);
        expect(readStepLimit({ ...base, saved: "1000" })).toBe(1000);
    });

    test("falls back when nothing was saved", () => {
        expect(readStepLimit({ ...base, saved: undefined })).toBe(200);
        expect(readStepLimit({ ...base, saved: null })).toBe(200);
        expect(readStepLimit({ ...base, saved: "" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "   " })).toBe(200);
    });

    test("falls back when the saved limit can't drive a run", () => {
        expect(readStepLimit({ ...base, saved: "0" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "-3" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "abc" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "12.5" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "NaN" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "12steps" })).toBe(200);
    });

    test("caps at the ceiling, never past it", () => {
        expect(readStepLimit({ ...base, saved: "1001" })).toBe(200);
        expect(readStepLimit({ ...base, saved: "999999" })).toBe(200);
        expect(readStepLimit({ fallback: 8, max: 50, saved: "51" })).toBe(8);
        expect(readStepLimit({ fallback: 8, max: 50, saved: "50" })).toBe(50);
    });
});
