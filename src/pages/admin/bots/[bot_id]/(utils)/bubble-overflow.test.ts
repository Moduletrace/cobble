import { describe, expect, test } from "bun:test";
import bubbleOverflows from "./bubble-overflow";

describe("bubbleOverflows", () => {
    test("a message that fits has nothing to open", () => {
        expect(
            bubbleOverflows({ scroll_height: 380, client_height: 380 }),
        ).toBe(false);
    });

    test("a line of rounding is no overflow", () => {
        expect(
            bubbleOverflows({ scroll_height: 380, client_height: 379 }),
        ).toBe(false);
    });

    test("a message taller than its room is cut", () => {
        expect(
            bubbleOverflows({ scroll_height: 1200, client_height: 400 }),
        ).toBe(true);
    });

    test("an empty bubble has nothing to open", () => {
        expect(bubbleOverflows({ scroll_height: 0, client_height: 0 })).toBe(
            false,
        );
    });
});