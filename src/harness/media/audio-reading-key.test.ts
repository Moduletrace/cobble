import { describe, expect, test } from "bun:test";
import audioReadingKey from "./audio-reading-key";

describe("audioReadingKey", () => {
    test("is a stable SHA-256 of the clip, not a fast hash (L8)", () => {
        const key = audioReadingKey({ data: "AQIDBA==" });

        expect(key).toBe(audioReadingKey({ data: "AQIDBA==" }));
        expect(key.startsWith("audio:")).toBe(true);
        expect(key.slice("audio:".length)).toMatch(/^[0-9a-f]{64}$/);
    });

    test("another clip is another transcript", () => {
        expect(audioReadingKey({ data: "AQIDBA==" })).not.toBe(audioReadingKey({ data: "BAECAw==" }));
    });
});