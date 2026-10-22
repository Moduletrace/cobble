import { describe, expect, test } from "bun:test";
import pathRef, { parsePathRefHref, pathRefHref, pathRefUrl } from "./path-ref";
import linkComputerRefs from "./link-computer-refs";

describe("pathRef", () => {
    test("writes a folder and a file", () => {
        expect(pathRef({ volume: "computer", owner_id: 3, path: "seo/coderank/raw" })).toBe(
            "[path:computer:3:seo/coderank/raw]",
        );
        expect(pathRef({ volume: "computer", owner_id: 3, path: "/seo/raw.json " })).toBe(
            "[path:computer:3:seo/raw.json]",
        );
        expect(pathRef({ volume: "bot", owner_id: 1 })).toBe("[path:bot:1]");
    });
});

describe("pathRefHref", () => {
    test("encodes the path into the link", () => {
        expect(pathRefHref({ volume: "computer", owner_id: 3, path: "seo/raw mes" })).toBe(
            `#path-${encodeURIComponent("computer:3:seo/raw mes")}`,
        );
    });

    test("reads back what it wrote", () => {
        const href = pathRefHref({ volume: "computer", owner_id: 3, path: "seo/raw mes/#1" });

        expect(parsePathRefHref({ href })).toEqual({
            spec: { volume: "computers", owner_id: 3 },
            path: "seo/raw mes/#1",
        });
    });

    test("maps the ref's volume name to the browser's", () => {
        expect(parsePathRefHref({ href: pathRefHref({ volume: "bot", owner_id: 1, path: "a" }) })).toEqual({
            spec: { volume: "bots", owner_id: 1 },
            path: "a",
        });
        expect(
            parsePathRefHref({ href: pathRefHref({ volume: "workspace", owner_id: 2 }) }),
        ).toEqual({
            spec: { volume: "workspaces", owner_id: 2 },
            path: "",
        });
    });

    test("refuses an unknown volume or owner", () => {
        expect(parsePathRefHref({ href: "#path-secrets:1:a" })).toBeNull();
        expect(parsePathRefHref({ href: "#path-computer:abc:a" })).toBeNull();
        expect(parsePathRefHref({ href: "#file-12" })).toBeNull();
        expect(parsePathRefHref({ href: undefined })).toBeNull();
    });
});

describe("pathRefUrl", () => {
    test("opens the files browser on the folder", () => {
        expect(pathRefUrl({ volume: "computer", owner_id: 3, path: "seo/raw" })).toBe(
            `/admin/files?volume=computers&owner=3&path=seo%2Fraw`,
        );
    });
});

describe("linkComputerRefs", () => {
    test("turns a path ref into a link", () => {
        const linked = linkComputerRefs({ text: "In [path:computer:3:seo/raw]." });

        expect(linked).toContain("(#path-");
        expect(parsePathRefHref({ href: linked.match(/\((#path-[^)]+)\)/)?.[1] })).toEqual({
            spec: { volume: "computers", owner_id: 3 },
            path: "seo/raw",
        });
    });
});
