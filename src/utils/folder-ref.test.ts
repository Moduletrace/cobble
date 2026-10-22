import { describe, expect, test } from "bun:test";
import folderRef, { folderRefHref, folderRefUrl, parseFolderRefHref } from "./folder-ref";
import linkComputerRefs from "./link-computer-refs";

describe("folderRef", () => {
    test("writes a folder, never a file", () => {
        expect(folderRef({ volume: "computer", owner_id: 3, path: "seo/coderank/raw" })).toBe(
            "[folder:computer:3:seo/coderank/raw]",
        );
        expect(folderRef({ volume: "computer", owner_id: 3, path: "/seo/raw/ " })).toBe(
            "[folder:computer:3:seo/raw]",
        );
        expect(folderRef({ volume: "bot", owner_id: 1 })).toBe("[folder:bot:1]");
    });
});

describe("folderRefHref", () => {
    test("encodes the path into the link", () => {
        expect(folderRefHref({ volume: "computer", owner_id: 3, path: "seo/raw mes" })).toBe(
            `#folder-${encodeURIComponent("computer:3:seo/raw mes")}`,
        );
    });

    test("reads back what it wrote", () => {
        const href = folderRefHref({ volume: "computer", owner_id: 3, path: "seo/raw mes/#1" });

        expect(parseFolderRefHref({ href })).toEqual({
            spec: { volume: "computers", owner_id: 3 },
            path: "seo/raw mes/#1",
        });
    });

    test("maps the ref's volume name to the browser's", () => {
        expect(parseFolderRefHref({ href: folderRefHref({ volume: "bot", owner_id: 1, path: "a" }) })).toEqual({
            spec: { volume: "bots", owner_id: 1 },
            path: "a",
        });
        expect(parseFolderRefHref({ href: folderRefHref({ volume: "workspace", owner_id: 2 }) })).toEqual({
            spec: { volume: "workspaces", owner_id: 2 },
            path: "",
        });
    });

    test("refuses an unknown volume, a bad owner, a file ref or nothing", () => {
        expect(parseFolderRefHref({ href: "#folder-secrets:1:a" })).toBeNull();
        expect(parseFolderRefHref({ href: "#folder-computer:abc:a" })).toBeNull();
        expect(parseFolderRefHref({ href: "#file-12" })).toBeNull();
        expect(parseFolderRefHref({ href: undefined })).toBeNull();
    });
});

describe("folderRefUrl", () => {
    test("opens the files browser on the folder", () => {
        expect(folderRefUrl({ volume: "computer", owner_id: 3, path: "seo/raw" })).toBe(
            `/admin/files?volume=computers&owner=3&path=seo%2Fraw`,
        );
    });

    test("keeps the folder when given the browser's own volume name", () => {
        /**
         * What the chip does: it holds a parsed spec, whose `volume` is the
         * browser's (`computers`), not the ref's (`computer`). Losing that
         * dropped the whole query and landed on the files browser's first
         * folder.
         */
        expect(folderRefUrl({ volume: "computers", owner_id: 1, path: "seo/coderank" })).toBe(
            `/admin/files?volume=computers&owner=1&path=seo%2Fcoderank`,
        );
        expect(folderRefUrl({ volume: "bots", owner_id: 6, path: "reports" })).toBe(
            `/admin/files?volume=bots&owner=6&path=reports`,
        );
    });

    test("falls back to the files browser for a volume it doesn't know", () => {
        expect(folderRefUrl({ volume: "secrets", owner_id: 1, path: "a" })).toBe("/admin/files");
        expect(folderRefUrl({ volume: "computers", owner_id: 0 })).toBe("/admin/files");
    });
});

describe("linkComputerRefs", () => {
    test("turns a folder ref into a link", () => {
        const linked = linkComputerRefs({ text: "In [folder:computer:3:seo/raw]." });

        expect(linked).toContain("(#folder-");
        expect(parseFolderRefHref({ href: linked.match(/\((#folder-[^)]+)\)/)?.[1] })).toEqual({
            spec: { volume: "computers", owner_id: 3 },
            path: "seo/raw",
        });
    });

    test("a linked folder ref still opens on that folder", () => {
        const linked = linkComputerRefs({ text: "straight off the machine: [folder:computer:1:seo/coderank]" });
        const ref = parseFolderRefHref({ href: linked.match(/\((#folder-[^)]+)\)/)?.[1] });

        expect(ref).not.toBeNull();
        expect(
            folderRefUrl({ volume: ref!.spec.volume, owner_id: ref!.spec.owner_id, path: ref!.path }),
        ).toBe(`/admin/files?volume=computers&owner=1&path=seo%2Fcoderank`);
    });

    test("leaves a file ref to the file chip", () => {
        const linked = linkComputerRefs({ text: "The report: [file:12]." });

        expect(linked).toContain("(#file-12)");
        expect(parseFolderRefHref({ href: linked.match(/\((#file-[^)]+)\)/)?.[1] })).toBeNull();
    });
});
