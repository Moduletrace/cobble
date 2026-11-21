import { describe, expect, test } from "bun:test";
import uniqueCopyName from "./unique-copy-name";

describe("uniqueCopyName", () => {
    test("a display name gets the worded marker", () => {
        expect(uniqueCopyName({ name: "GitHub", taken: [], style: "words" })).toBe("GitHub (imported)");
    });

    test("a taken marker counts up", () => {
        expect(uniqueCopyName({ name: "GitHub", taken: ["GitHub (imported)"], style: "words" })).toBe(
            "GitHub (imported 2)",
        );
    });

    test("a tool name stays snake_case", () => {
        expect(uniqueCopyName({ name: "fetch_page", taken: [], style: "snake" })).toBe("fetch_page_imported");
        expect(uniqueCopyName({ name: "fetch_page", taken: ["fetch_page_imported"], style: "snake" })).toBe(
            "fetch_page_imported_2",
        );
    });

    test("a slug stays lowercase with hyphens", () => {
        expect(uniqueCopyName({ name: "weekly-seo-report", taken: [], style: "dash" })).toBe(
            "weekly-seo-report-imported",
        );
    });

    test("a long name is cut to make room, never past the limit", () => {
        const copy = uniqueCopyName({ name: "a".repeat(64), taken: [], style: "dash", max_length: 64 });

        expect(copy.length).toBe(64);
        expect(copy.endsWith("-imported")).toBe(true);
    });
});