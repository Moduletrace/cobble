import { describe, expect, test } from "bun:test";
import parseFileRef from "./parse-file-ref";

describe("parseFileRef", () => {
    test("reads the ref a bot copies out of a tool result", () => {
        expect(parseFileRef({ ref: "[file:12]" })).toBe(12);
        expect(parseFileRef({ ref: "  [file: 7]  " })).toBe(7);
        expect(parseFileRef({ ref: "[FILE:3]" })).toBe(3);
    });

    test("takes a bare id as text or as a number", () => {
        expect(parseFileRef({ ref: "42" })).toBe(42);
        expect(parseFileRef({ ref: 42 })).toBe(42);
    });

    test("refuses anything that isn't a positive whole number", () => {
        for (const ref of ["", "  ", "abc", "[file:abc]", "0", "-2", 0, -2, 1.5, "[file:1.5]", null, undefined]) {
            expect(parseFileRef({ ref })).toBeNull();
        }
    });

    test("refuses a ref that got pasted with other text around it", () => {
        expect(parseFileRef({ ref: "logo.png [file:12]" })).toBeNull();
        expect(parseFileRef({ ref: "[file:12][file:13]" })).toBeNull();
    });
});
