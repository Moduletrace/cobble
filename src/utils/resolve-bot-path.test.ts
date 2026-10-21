import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import resolveBotPath from "./resolve-bot-path";

function makeRoot() {
    return mkdtempSync(path.join(tmpdir(), "cobble-botfiles-"));
}

describe("resolveBotPath", () => {
    test("keeps a normal path inside the root", () => {
        const root = makeRoot();
        const resolved = resolveBotPath({ root, path: "reports/q3.md" });

        expect(resolved.relative).toBe("reports/q3.md");
        expect(resolved.folder).toBe("reports");
        expect(resolved.name).toBe("q3.md");
        expect(resolved.absolute.startsWith(root)).toBe(true);
    });

    test("normalizes backslashes and extra slashes", () => {
        const resolved = resolveBotPath({ root: makeRoot(), path: "notes//today.md/" });

        expect(resolved.relative).toBe("notes/today.md");
    });

    test("refuses an absolute path", () => {
        expect(() => resolveBotPath({ root: makeRoot(), path: "/etc/passwd" })).toThrow();
        expect(() => resolveBotPath({ root: makeRoot(), path: "C:/windows" })).toThrow();
    });

    test("refuses going up out of the root", () => {
        expect(() => resolveBotPath({ root: makeRoot(), path: "../secret.txt" })).toThrow();
        expect(() => resolveBotPath({ root: makeRoot(), path: "a/../../secret.txt" })).toThrow();
    });

    test("refuses a NUL byte", () => {
        expect(() => resolveBotPath({ root: makeRoot(), path: "a\0b.txt" })).toThrow();
    });

    test("refuses a symlink that leads out of the root", () => {
        const root = makeRoot();
        const outside = makeRoot();
        writeFileSync(path.join(outside, "secret.txt"), "no");

        mkdirSync(path.join(root, "linked"));
        symlinkSync(outside, path.join(root, "linked", "escape"));

        expect(() =>
            resolveBotPath({ root, path: "linked/escape/secret.txt" }),
        ).toThrow();
    });

    test("allows a symlink that stays inside", () => {
        const root = makeRoot();
        mkdirSync(path.join(root, "real"));
        writeFileSync(path.join(root, "real", "note.md"), "hi");
        symlinkSync(path.join(root, "real"), path.join(root, "alias"));

        expect(resolveBotPath({ root, path: "alias/note.md" }).relative).toBe("alias/note.md");
    });

    test("refuses a name too long", () => {
        expect(() =>
            resolveBotPath({ root: makeRoot(), path: `${"a".repeat(200)}.md` }),
        ).toThrow();
    });

    test("refuses a path too deep", () => {
        const deep = Array.from({ length: 12 }, (_, i) => `d${i}`).join("/");

        expect(() => resolveBotPath({ root: makeRoot(), path: `${deep}/file.md` })).toThrow();
    });

    test("refuses a name with characters a disk won't take", () => {
        expect(() => resolveBotPath({ root: makeRoot(), path: "a<b.md" })).toThrow();
    });
});
