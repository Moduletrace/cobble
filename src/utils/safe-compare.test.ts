import { describe, expect, test } from "bun:test";
import { safeCompare } from "./safe-compare";

describe("safeCompare", () => {
    test("returns true for equal strings", () => {
        expect(safeCompare("abc", "abc")).toBe(true);
        expect(safeCompare("", "")).toBe(true);
    });

    test("returns false for different strings", () => {
        expect(safeCompare("abc", "abd")).toBe(false);
        expect(safeCompare("abc", "abc ")).toBe(false);
        expect(safeCompare("abc", "")).toBe(false);
    });

    test("is length-independent", () => {
        expect(safeCompare("a", "b")).toBe(false);
        expect(safeCompare("short", "longer-than-short")).toBe(false);
    });
});