import { describe, expect, test } from "bun:test";
import {
    botColorNeedsPaperFace,
    normalizeBotColor,
    paletteColor,
    paletteColorTitle,
    resolveBotColor,
    resolveBotStone,
} from "./bot-color";

describe("bot-color", () => {
    test("normalizes a colour to lowercase #rrggbb", () => {
        expect(normalizeBotColor({ color: "  #E4572E " })).toBe("#e4572e");
    });

    test("expands the short form", () => {
        expect(normalizeBotColor({ color: "#7C5" })).toBe("#77cc55");
    });

    test("refuses anything that isn't a colour", () => {
        expect(normalizeBotColor({ color: "violet" })).toBeNull();
        expect(normalizeBotColor({ color: "#12345" })).toBeNull();
        expect(normalizeBotColor({ color: "" })).toBeNull();
        expect(normalizeBotColor({ color: null })).toBeNull();
    });

    test("names a palette colour, and leaves a custom one unnamed", () => {
        expect(paletteColorTitle({ color: "#7c5cd6" })).toBe("Violet");
        expect(paletteColorTitle({ color: "#123456" })).toBeNull();
    });

    test("a bot's own colour wins over its old hue", () => {
        expect(resolveBotColor({ color: "#123456", hue: "violet" })).toBe("#123456");
    });

    test("a bot saved before colours were free shows its hue's colour", () => {
        expect(resolveBotColor({ hue: "teal" })).toBe("#16a394");
    });

    test("the coordinator has no colour", () => {
        expect(resolveBotColor({})).toBeNull();
    });

    test("keeps its own stone, else the shape its hue used to be", () => {
        expect(resolveBotStone({ stone: "rose", hue: "teal" })).toBe("rose");
        expect(resolveBotStone({ hue: "teal" })).toBe("teal");
        expect(resolveBotStone({})).toBe("ember");
    });

    test("only a very dark colour flips the face to paper", () => {
        expect(botColorNeedsPaperFace({ color: "#000000" })).toBe(true);
        expect(botColorNeedsPaperFace({ color: "#0e1116" })).toBe(true);
        expect(botColorNeedsPaperFace({ color: "#7c5cd6" })).toBe(false);
        expect(botColorNeedsPaperFace({ color: "#ffffff" })).toBe(false);
    });

    test("a palette entry knows its own colour", () => {
        expect(paletteColor({ hue: "ember" })).toBe("#e4572e");
        expect(paletteColor({ hue: "nonsense" })).toBeNull();
    });
});
