import { describe, expect, test } from "bun:test";
import hexToRgbFractions from "./hex-to-rgb-fractions";

describe("hexToRgbFractions", () => {
    test("converts 6-digit hex", () => {
        expect(hexToRgbFractions({ hex: "#ff0000" })).toEqual({
            r: 1,
            g: 0,
            b: 0,
        });
    });

    test("expands 3-digit hex", () => {
        expect(hexToRgbFractions({ hex: "#fff" })).toEqual({
            r: 1,
            g: 1,
            b: 1,
        });
    });

    test("ignores alpha", () => {
        expect(hexToRgbFractions({ hex: "#00000080" })).toEqual({
            r: 0,
            g: 0,
            b: 0,
        });
    });
});
