import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import pruneProfileSecrets from "./prune-profile-secrets";

/**
 * A profile is mounted so a computer keeps its cookies and extensions, and
 * this runs at every start: a file wrongly listed here logs the user out of
 * every site, one wrongly left out keeps a saved password within a bot's
 * reach.
 */
const dirs: string[] = [];

function profile() {
    const dir = mkdtempSync(path.join(tmpdir(), "cobble-profile-secrets-"));

    dirs.push(dir);

    return dir;
}

function write({ root, relative }: { root: string; relative: string }) {
    const target = path.join(root, relative);

    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, "x");
}

afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("pruneProfileSecrets", () => {
    test("removes the saved-password stores of every profile", () => {
        const root = profile();

        write({ root, relative: "Default/Login Data" });
        write({ root, relative: "Default/Login Data-journal" });
        write({ root, relative: "Default/Login Data For Account" });
        write({ root, relative: "Default/Account Web Data" });
        write({ root, relative: "Default/Web Data" });
        write({ root, relative: "Profile 1/Login Data" });

        expect(pruneProfileSecrets({ profile_dir: root })).toBe(6);
        expect(existsSync(path.join(root, "Default/Login Data"))).toBe(false);
        expect(existsSync(path.join(root, "Default/Login Data For Account"))).toBe(false);
        expect(existsSync(path.join(root, "Default/Account Web Data"))).toBe(false);
        expect(existsSync(path.join(root, "Default/Web Data"))).toBe(false);
        expect(existsSync(path.join(root, "Profile 1/Login Data"))).toBe(false);
    });

    test("keeps what signs the user in to their sites", () => {
        const root = profile();

        write({ root, relative: "Default/Cookies" });
        write({ root, relative: "Default/Cookies-journal" });
        write({ root, relative: "Local State" });
        write({ root, relative: "Default/History" });
        write({ root, relative: "Default/Preferences" });
        write({ root, relative: "Default/Extensions/abc/1.0/manifest.json" });

        expect(pruneProfileSecrets({ profile_dir: root })).toBe(0);
        expect(existsSync(path.join(root, "Default/Cookies"))).toBe(true);
        expect(existsSync(path.join(root, "Local State"))).toBe(true);
        expect(existsSync(path.join(root, "Default/History"))).toBe(true);
        expect(existsSync(path.join(root, "Default/Extensions/abc/1.0/manifest.json"))).toBe(true);
    });

    test("leaves a folder that isn't a profile alone", () => {
        const root = profile();

        write({ root, relative: "Crashpad/metrics/Login Data" });

        expect(pruneProfileSecrets({ profile_dir: root })).toBe(0);
        expect(existsSync(path.join(root, "Crashpad/metrics/Login Data"))).toBe(true);
    });

    test("counts nothing when there is no profile yet", () => {
        expect(pruneProfileSecrets({ profile_dir: path.join(profile(), "missing") })).toBe(0);
    });
});