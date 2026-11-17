import { describe, expect, test } from "bun:test";
import fitVectorDimensions from "./fit-vector-dimensions";

describe("fitVectorDimensions", () => {
    test("normalizes a vector to unit length", () => {
        const out = fitVectorDimensions({ vector: [3, 4], dimensions: 2 });

        expect(out[0]).toBeCloseTo(0.6);
        expect(out[1]).toBeCloseTo(0.8);
    });

    test("cuts a wider vector and pads a narrower one", () => {
        expect(fitVectorDimensions({ vector: [1, 0, 0, 0], dimensions: 2 }).length).toBe(2);

        const padded = fitVectorDimensions({ vector: [1], dimensions: 3 });

        expect(padded.length).toBe(3);
        expect(padded[1]).toBe(0);
        expect(padded[2]).toBe(0);
    });

    test("a non-finite component becomes zero, never NaN (L8)", () => {
        const out = fitVectorDimensions({ vector: [Infinity, 1, NaN, -Infinity], dimensions: 4 });

        expect(Array.from(out).every((n) => Number.isFinite(n))).toBe(true);
        expect(out[0]).toBe(0);
        expect(out[2]).toBe(0);
        expect(out[3]).toBe(0);
        expect(out[1]).toBeCloseTo(1);
    });

    test("a zero vector stays zero", () => {
        const out = fitVectorDimensions({ vector: [0, 0], dimensions: 2 });

        expect(out[0]).toBe(0);
        expect(out[1]).toBe(0);
    });
});