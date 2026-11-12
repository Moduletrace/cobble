import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pruneProfileCache from "./prune-profile-cache";

/**
 * The profile is mounted from the data volume, so whatever this clears is
 * gone for good. A cache comes back by itself, an extension's own state
 * never does, so only caches may ever be in these lists.
 */
const roots: string[] = [];

function profile() {
    const root = mkdtempSync(path.join(tmpdir(), "cobble-profile-"));

    roots.push(root);

    return root;
}

function write({ root, relative }: { root: string; relative: string }) {
    const target = path.join(root, relative);

    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, "x".repeat(1024));
}

function exists({ root, relative }: { root: string; relative: string }) {
    return require("node:fs").existsSync(path.join(root, relative));
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("pruneProfileCache", () => {
    test("keeps an extension's own state", () => {
        const root = profile();

        write({ root, relative: "Default/Storage/ext/abc/def" });
        write({ root, relative: "Default/Local Storage/leveldb/000003.log" });

        pruneProfileCache({ profile_dir: root });

        expect(exists({ root, relative: "Default/Storage/ext/abc/def" })).toBeTrue();
        expect(exists({ root, relative: "Default/Local Storage/leveldb/000003.log" })).toBeTrue();
    });

    test("never touches a login, a permission or history", () => {
        const root = profile();

        write({ root, relative: "Default/Cookies" });
        write({ root, relative: "Default/Login Data" });
        write({ root, relative: "Default/Preferences" });
        write({ root, relative: "Default/History" });
        write({ root, relative: "Default/Extensions/abc/1.0/manifest.json" });

        pruneProfileCache({ profile_dir: root });

        for (const relative of ["Default/Cookies", "Default/Login Data", "Default/Preferences", "Default/History", "Default/Extensions/abc/1.0/manifest.json"]) {
            expect(exists({ root, relative })).toBeTrue();
        }
    });
});