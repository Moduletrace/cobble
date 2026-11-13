import { describe, expect, test } from "bun:test";
import { isUnlimitedLimit, smallerRunLimit, UnlimitedLimit } from "./run-limit";

describe("isUnlimitedLimit", () => {
    test("knows the sentinel and nothing else", () => {
        expect(isUnlimitedLimit(UnlimitedLimit)).toBe(true);
        expect(isUnlimitedLimit("unlimited")).toBe(true);
        expect(isUnlimitedLimit(0)).toBe(false);
        expect(isUnlimitedLimit(20)).toBe(false);
        expect(isUnlimitedLimit(null)).toBe(false);
        expect(isUnlimitedLimit(undefined)).toBe(false);
        expect(isUnlimitedLimit("20")).toBe(false);
        expect(isUnlimitedLimit("Unlimited")).toBe(false);
    });
});

describe("smallerRunLimit", () => {
    test("takes the smaller of two limits", () => {
        expect(smallerRunLimit({ a: 60, b: 20 })).toBe(20);
        expect(smallerRunLimit({ a: 20, b: 60 })).toBe(20);
        expect(smallerRunLimit({ a: 60, b: 60 })).toBe(60);
    });

    test("no limit yields to any real one", () => {
        expect(smallerRunLimit({ a: UnlimitedLimit, b: 40 })).toBe(40);
        expect(smallerRunLimit({ a: 40, b: UnlimitedLimit })).toBe(40);
    });

    test("no limit on both sides stays no limit", () => {
        expect(smallerRunLimit({ a: UnlimitedLimit, b: UnlimitedLimit })).toBe(UnlimitedLimit);
    });
});