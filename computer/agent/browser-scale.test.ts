import { describe, expect, test } from "bun:test";
import browserScale from "./browser-scale";

describe("browserScale", () => {
    test("reads a factor", () => {
        expect(browserScale({ text: "1.25" })).toBe(1.25);
        expect(browserScale({ text: "2" })).toBe(2);
        expect(browserScale({ text: "1" })).toBe(1);
    });

    test("falls back to 1.25 for nothing or anything out of range", () => {
        for (const text of [undefined, "", "abc", "0.5", "4", "-1"]) expect(browserScale({ text })).toBe(1.25);
    });
});
