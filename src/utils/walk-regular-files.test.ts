import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import walkRegularFiles from "./walk-regular-files";

let root = "";
let outside = "";

beforeAll(() => {
    root = mkdtempSync(path.join(tmpdir(), "cobble-walk-"));
    outside = mkdtempSync(path.join(tmpdir(), "cobble-walk-outside-"));

    writeFileSync(path.join(outside, "secret.env"), "ENCRYPTION_KEY=x");
    mkdirSync(path.join(outside, "folder"));
    writeFileSync(path.join(outside, "folder", "db.sqlite"), "db");

    mkdirSync(path.join(root, "reports"));
    writeFileSync(path.join(root, "a.md"), "a");
    writeFileSync(path.join(root, "reports", "b.md"), "b");
    symlinkSync(path.join(outside, "secret.env"), path.join(root, "secret.env"));
    symlinkSync(path.join(outside, "folder"), path.join(root, "linked"));
});

afterAll(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
});

describe("walkRegularFiles", () => {
    test("lists regular files in nested folders", () => {
        const found = [...walkRegularFiles({ dir: root })].map((p) => path.relative(root, p)).sort();

        expect(found).toEqual(["a.md", "reports/b.md"]);
    });

    test("never follows a symlink to a file or a folder", () => {
        const found = [...walkRegularFiles({ dir: root })];

        expect(found.some((p) => p.includes("secret.env"))).toBe(false);
        expect(found.some((p) => p.includes("db.sqlite"))).toBe(false);
    });
});
