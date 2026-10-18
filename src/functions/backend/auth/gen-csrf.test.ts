import { describe, expect, test } from "bun:test";
import generateCSRF from "./gen-csrf";

describe("generateCSRF", () => {
    test("returns a non-empty string", () => {
        expect(generateCSRF().length).toBeGreaterThan(0);
    });

    test("is unique across calls", () => {
        const a = generateCSRF();
        const b = generateCSRF();
        expect(a).not.toBe(b);
    });

    test("produces url-safe base64 characters only", () => {
        expect(generateCSRF()).toMatch(/^[A-Za-z0-9_-]+$/);
    });
});