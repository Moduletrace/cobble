import { describe, expect, test } from "bun:test";
import isNewerStep from "./is-newer-step";

/**
 * A row that reloads mid-run reads the reply's step from the server while a
 * live push may already show a later one: the line only moves forward.
 */
describe("isNewerStep", () => {
    test("the first step is taken", () => {
        expect(isNewerStep({ shown: null, step: { id: 7 } })).toBe(true);
    });

    test("a later step replaces the one shown", () => {
        expect(isNewerStep({ shown: { id: 7 }, step: { id: 8 } })).toBe(true);
    });

    test("an older one read from the server leaves the newer push alone", () => {
        expect(isNewerStep({ shown: { id: 8 }, step: { id: 7 } })).toBe(false);
    });

    test("the same step read again changes nothing", () => {
        expect(isNewerStep({ shown: { id: 8 }, step: { id: 8 } })).toBe(false);
    });

    test("no step takes nothing", () => {
        expect(isNewerStep({ shown: { id: 8 }, step: null })).toBe(false);
    });
});