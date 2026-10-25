import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import resolveStoragePath, { isInsideRoot } from "./resolve-storage-path";

const base = mkdtempSync(path.join(tmpdir(), "cobble-storage-path-"));
const root = path.join(base, "root");
const outside = path.join(base, "outside");

mkdirSync(path.join(root, "reports"), { recursive: true });
mkdirSync(outside, { recursive: true });
writeFileSync(path.join(root, "reports", "q3.md"), "# Q3");
writeFileSync(path.join(outside, "secret.md"), "secret");
symlinkSync(outside, path.join(root, "escape"));

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("resolveStoragePath", () => {
    test("keeps a path inside the root", () => {
        expect(resolveStoragePath({ root, path: "reports/q3.md" })).toEqual({
            relative: "reports/q3.md",
            absolute: path.join(root, "reports", "q3.md"),
            folder: "reports",
            name: "q3.md",
        });
    });

    test("normalizes slashes and trims", () => {
        expect(resolveStoragePath({ root, path: " reports// /q3.md " }).relative).toBe(
            "reports/q3.md",
        );
    });

    test("reads the root itself", () => {
        expect(resolveStoragePath({ root, path: "" })).toEqual({
            relative: "",
            absolute: path.resolve(root),
            folder: "",
            name: "",
        });
        expect(resolveStoragePath({ root, path: null }).name).toBe("");
    });

    test("refuses an absolute path", () => {
        expect(() => resolveStoragePath({ root, path: "/etc/passwd" })).toThrow();
        expect(() => resolveStoragePath({ root, path: "C:/windows" })).toThrow();
    });

    test("refuses climbing out", () => {
        expect(() => resolveStoragePath({ root, path: "../outside/secret.md" })).toThrow();
        expect(() => resolveStoragePath({ root, path: "reports/../../outside" })).toThrow();
        expect(() => resolveStoragePath({ root, path: "./q3.md" })).toThrow();
    });

    test("refuses a NUL byte", () => {
        expect(() => resolveStoragePath({ root, path: "reports/q3.md\0" })).toThrow();
    });

    test("refuses a symlink that leads out", () => {
        expect(() => resolveStoragePath({ root, path: "escape/secret.md" })).toThrow();
    });

    test("refuses a path that is too deep", () => {
        expect(() =>
            resolveStoragePath({ root, path: Array.from({ length: 20 }, (_, i) => `f${i}`).join("/") }),
        ).toThrow();
    });
});

describe("isInsideRoot", () => {
    test("tells a child from a sibling", () => {
        expect(isInsideRoot({ root, absolute: path.join(root, "reports") })).toBe(true);
        expect(isInsideRoot({ root, absolute: root })).toBe(true);
        expect(isInsideRoot({ root, absolute: path.join(base, "rooted") })).toBe(false);
        expect(isInsideRoot({ root, absolute: outside })).toBe(false);
    });
});
