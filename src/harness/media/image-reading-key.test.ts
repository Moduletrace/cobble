import { describe, expect, test } from "bun:test";
import imageReadingKey from "./image-reading-key";

describe("imageReadingKey", () => {
    test("is a stable SHA-256 of the url and focus, not a fast hash (L8)", () => {
        const key = imageReadingKey({ url: "https://x/img.png", focus: "the screen" });

        expect(key).toBe(imageReadingKey({ url: "https://x/img.png", focus: "the screen" }));
        expect(key.startsWith("image:")).toBe(true);
        expect(key.slice("image:".length)).toMatch(/^[0-9a-f]{64}$/);
    });

    test("another focus is another reading", () => {
        expect(imageReadingKey({ url: "https://x/img.png", focus: "the screen" })).not.toBe(
            imageReadingKey({ url: "https://x/img.png", focus: "the error" }),
        );
    });

    test("another image is another reading", () => {
        expect(imageReadingKey({ url: "https://x/a.png" })).not.toBe(
            imageReadingKey({ url: "https://x/b.png" }),
        );
    });

    test("no focus and an empty focus are the same reading", () => {
        expect(imageReadingKey({ url: "https://x/img.png" })).toBe(
            imageReadingKey({ url: "https://x/img.png", focus: "" }),
        );
    });
});