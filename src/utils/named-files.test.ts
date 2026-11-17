import { describe, expect, test } from "bun:test";
import namedFiles from "./named-files";

describe("namedFiles", () => {
    test("finds a path the brief names", () => {
        const files = namedFiles({
            text: "Build a layered PSD from uploads/2026-11/summit-canva-v1.png, keeping the layers.",
        });

        expect(files).toEqual([{ path: "uploads/2026-11/summit-canva-v1.png", name: "summit-canva-v1.png" }]);
    });

    test("finds a bare name with a known extension", () => {
        expect(namedFiles({ text: "use summit-canva-v1.png as the source" })).toEqual([
            { path: "summit-canva-v1.png", name: "summit-canva-v1.png" },
        ]);
    });

    test("leaves prose alone", () => {
        expect(namedFiles({ text: "run it with node.js, then bump to v1.2, e.g. the Build step" })).toEqual([]);
    });

    test("keeps the order the brief names them in, and dedupes", () => {
        const files = namedFiles({
            text: "Compare report.pdf with notes.md, then with report.pdf again.",
        });

        expect(files.map((file) => file.name)).toEqual(["report.pdf", "notes.md"]);
    });

    test("stops at the limit", () => {
        const files = namedFiles({ text: "a.png b.png c.png d.png e.png f.png g.png", limit: 3 });

        expect(files.map((file) => file.name)).toEqual(["a.png", "b.png", "c.png"]);
    });

    test("drops a URL's path", () => {
        expect(namedFiles({ text: "download it from https://example.com/media/source.png first" })).toEqual([]);
    });

    test("finds nothing in an empty brief", () => {
        expect(namedFiles({ text: "   \n " })).toEqual([]);
    });
});