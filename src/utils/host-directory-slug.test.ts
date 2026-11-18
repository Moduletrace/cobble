import { describe, expect, test } from "bun:test";
import hostDirectorySlug from "./host-directory-slug";
import makeHostDirectorySlug from "./make-host-directory-slug";

describe("hostDirectorySlug", () => {
    test("lowercases and dashes a name", () => {
        expect(hostDirectorySlug({ name: "Client Sites" })).toBe("client-sites");
        expect(hostDirectorySlug({ name: "  Reports & Data  " })).toBe("reports-data");
    });

    test("takes accents off", () => {
        expect(hostDirectorySlug({ name: "Café Crème" })).toBe("cafe-creme");
    });

    test("keeps a name it can't read from being empty", () => {
        expect(hostDirectorySlug({ name: "日本語" })).toBe("folder");
        expect(hostDirectorySlug({ name: "" })).toBe("folder");
    });

    test("cuts a long name without ending in a dash", () => {
        const slug = hostDirectorySlug({ name: "a".repeat(40) });
        expect(slug.length).toBe(32);
        expect(slug.endsWith("-")).toBe(false);
    });
});

describe("makeHostDirectorySlug", () => {
    test("uses the name when it is free", () => {
        expect(makeHostDirectorySlug({ name: "Notes", taken: [] })).toBe("notes");
    });

    test("numbers a name already taken", () => {
        expect(makeHostDirectorySlug({ name: "Notes", taken: ["notes"] })).toBe("notes-2");
        expect(makeHostDirectorySlug({ name: "Notes", taken: ["notes", "notes-2"] })).toBe("notes-3");
    });

    test("keeps the suffix on a long name", () => {
        const name = "a".repeat(40);
        const slug = makeHostDirectorySlug({ name, taken: ["a".repeat(32)] });
        expect(slug.length).toBeLessThanOrEqual(32);
        expect(slug.endsWith("-2")).toBe(true);
    });
});