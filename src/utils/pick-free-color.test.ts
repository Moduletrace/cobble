import { describe, expect, test } from "bun:test";
import pickFreeColor from "./pick-free-color";

describe("pick-free-color", () => {
    test("takes the first palette colour nobody has", () => {
        expect(pickFreeColor({ taken: [] })).toEqual({ color: "#e4572e", stone: "ember" });
    });

    test("skips the colours already taken", () => {
        expect(pickFreeColor({ taken: ["#e4572e", "#e9a23b", null] })).toEqual({
            color: "#7fae3c",
            stone: "moss",
        });
    });

    test("falls back to the least used colour", () => {
        const everyone = ["#e4572e", "#e9a23b", "#7fae3c", "#16a394", "#3b7dd8", "#7c5cd6"];

        expect(pickFreeColor({ taken: [...everyone, "#e4572e"] })).toEqual({
            color: "#d6538c",
            stone: "rose",
        });
    });

    test("counts a colour however it's cased", () => {
        expect(pickFreeColor({ taken: ["#E4572E"] }).color).toBe("#e9a23b");
    });
});
