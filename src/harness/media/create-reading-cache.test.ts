import { describe, expect, test } from "bun:test";
import createReadingCache from "./create-reading-cache";

describe("createReadingCache", () => {
    test("keeps a reading by key", () => {
        const cache = createReadingCache({ max: 4 });

        cache.set({ key: "a", text: "A cat." });

        expect(cache.get({ key: "a" })).toBe("A cat.");
        expect(cache.get({ key: "b" })).toBeUndefined();
    });

    test("drops the least recently used reading when full", () => {
        const cache = createReadingCache({ max: 2 });

        cache.set({ key: "a", text: "A" });
        cache.set({ key: "b", text: "B" });
        // Using "a" again keeps it, so "b" is the oldest.
        expect(cache.get({ key: "a" })).toBe("A");
        cache.set({ key: "c", text: "C" });

        expect(cache.size()).toBe(2);
        expect(cache.get({ key: "a" })).toBe("A");
        expect(cache.get({ key: "b" })).toBeUndefined();
        expect(cache.get({ key: "c" })).toBe("C");
    });

    test("a new reading for a key replaces the old one", () => {
        const cache = createReadingCache({ max: 4 });

        cache.set({ key: "a", text: "first" });
        cache.set({ key: "a", text: "second" });

        expect(cache.get({ key: "a" })).toBe("second");
        expect(cache.size()).toBe(1);
    });

    test("clears", () => {
        const cache = createReadingCache({ max: 4 });

        cache.set({ key: "a", text: "A" });
        cache.clear();

        expect(cache.get({ key: "a" })).toBeUndefined();
        expect(cache.size()).toBe(0);
    });
});
