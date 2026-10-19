import { describe, expect, test } from "bun:test";
import computerRef from "./computer-ref";
import linkComputerRefs from "./link-computer-refs";

describe("linkComputerRefs", () => {
    test("links every computer a message names", () => {
        expect(
            linkComputerRefs({
                text: `Your GitHub session is on ${computerRef({ id: 3 })}, not ${computerRef({ id: 12 })}.`,
            }),
        ).toBe("Your GitHub session is on [computer 3](#computer-3), not [computer 12](#computer-12).");
    });

    test("leaves look-alikes and existing links alone", () => {
        const text = "See [computer:x], [link](url) and [computer:4](https://example.com)";

        expect(linkComputerRefs({ text })).toBe(text);
    });
});
