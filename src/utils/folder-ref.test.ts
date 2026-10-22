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

    test("leaves a file ref to the file chip", () => {
        const linked = linkComputerRefs({ text: "The report: [file:12]." });

        expect(linked).toContain("(#file-12)");
        expect(parseFolderRefHref({ href: linked.match(/\((#file-[^)]+)\)/)?.[1] })).toBeNull();
    });
});
