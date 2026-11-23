import { describe, expect, test } from "bun:test";
import { isCardRefHref } from "./card-ref-href";

describe("isCardRefHref", () => {
    test("a connect ref is a card", () => {
        expect(isCardRefHref({ href: "#connect-4" })).toBe(true);
    });

    test("a take-over ref is a card", () => {
        expect(isCardRefHref({ href: "#take-over-3-browser" })).toBe(true);
    });

    test("a file ref stays on the line", () => {
        expect(isCardRefHref({ href: "#file-4" })).toBe(false);
    });

    test("an empty href is no card", () => {
        expect(isCardRefHref({ href: undefined })).toBe(false);
    });
});