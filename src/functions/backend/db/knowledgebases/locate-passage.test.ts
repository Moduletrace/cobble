import { describe, expect, test } from "bun:test";
import locatePassage from "./locate-passage";

describe("locatePassage", () => {
    const text = "# Leave\n\nTwenty days a year.\n\n# Refunds\n\nRefunds are issued within fourteen days.";

    test("finds a passage by its last line, counted back by what comes before it", () => {
        const at = locatePassage({ text, passage: "# Refunds\n\nRefunds are issued within fourteen days." });

        expect(text.slice(at).startsWith("# Refunds")).toBe(true);
    });

    test("starts at the top when it can't be found", () => {
        expect(locatePassage({ text, passage: "Nothing like this" })).toBe(0);
    });
});
