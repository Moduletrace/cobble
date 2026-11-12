import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pruneProfileCache from "./prune-profile-cache";

/**
 * The profile is mounted so logins survive a restart, and this runs at
 * every start: a folder wrongly listed here would log the user out of
 * every site, and one wrongly left out grows the volume forever.
 */
const dirs: string[] = [];

function profile() {
    const dir = mkdtempSync(path.join(tmpdir(), "cobble-profile-"));

    dirs.push(dir);

    return dir;
}

function write({ root, relative, bytes }: { root: string; relative: string; bytes: number }) {
    const target = path.join(root, relative);

    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, "x".repeat(bytes));
}

afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("pruneProfileCache", () => {
    test("clears a profile's caches and the ones Chrome keeps beside it", () => {
        const root = profile();

        write({ root, relative: "Default/Cache/data_0", bytes: 400 });
        write({ root, relative: "Default/Code Cache/js/index", bytes: 300 });
        write({ root, relative: "Default/Service Worker/CacheStorage/a/b", bytes: 200 });
        write({ root, relative: "Profile 1/Cache/data_0", bytes: 100 });
        write({ root, relative: "ShaderCache/data", bytes: 500 });
        write({ root, relative: "GPUCache/data", bytes: 50 });

        expect(pruneProfileCache({ profile_dir: root })).toBe(1550);

        for (const gone of [
            "Default/Cache",
            "Default/Code Cache",
            "Default/Service Worker/CacheStorage",
            "Profile 1/Cache",
            "ShaderCache",
            "GPUCache",
        ]) {
            expect(existsSync(path.join(root, gone))).toBe(false);
        }
    });

    test("never touches a login, a permission or an extension", () => {
        const root = profile();

        write({ root, relative: "Default/Cookies", bytes: 10 });
        write({ root, relative: "Default/Login Data", bytes: 10 });
        write({ root, relative: "Default/Preferences", bytes: 10 });
        write({ root, relative: "Default/Local Storage/leveldb/a.log", bytes: 10 });
        write({ root, relative: "Default/Extensions/abc/1.0/page.html", bytes: 10 });
        write({ root, relative: "Local State", bytes: 10 });

        expect(pruneProfileCache({ profile_dir: root })).toBe(0);

        for (const kept of [
            "Default/Cookies",
            "Default/Login Data",
            "Default/Preferences",
            "Default/Local Storage",
            "Default/Extensions",
            "Local State",
        ]) {
            expect(existsSync(path.join(root, kept))).toBe(true);
        }
    });

    test("a folder that isn't a profile is left alone", () => {
        const root = profile();

        write({ root, relative: "SomeOtherProfile/Cache/data_0", bytes: 400 });

        expect(pruneProfileCache({ profile_dir: root })).toBe(0);
        expect(readdirSync(root)).toEqual(["SomeOtherProfile"]);
    });

    test("an empty or missing profile frees nothing and throws nothing", () => {
        const root = profile();

        expect(pruneProfileCache({ profile_dir: root })).toBe(0);
        expect(pruneProfileCache({ profile_dir: path.join(root, "missing") })).toBe(0);
    });
});