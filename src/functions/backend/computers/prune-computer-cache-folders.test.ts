import { afterEach, describe, expect, test } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import pruneComputerCacheFolders from "./prune-computer-cache-folders";

const dirs: string[] = [];

function makeRoot() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cobble-prune-"));

    dirs.push(dir);

    return dir;
}

function write({ root, relative, content = "x" }: { root: string; relative: string; content?: string }) {
    const target = path.join(root, relative);

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}

function has({ root, relative }: { root: string; relative: string }) {
    return fs.existsSync(path.join(root, relative));
}

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe("pruneComputerCacheFolders", () => {
    test("clears caches, bytecode and a bot's own browser profile's caches, and nothing else", async () => {
        const computer_dir = makeRoot();
        const profile_dir = makeRoot();

        write({ root: computer_dir, relative: "bots/3/keep.md" });
        write({ root: computer_dir, relative: "bots/3/.cache/pip/wheel" });
        write({ root: computer_dir, relative: "bots/3/.npm/_cacache/index" });
        write({ root: computer_dir, relative: "bots/3/.npm/_logs/debug.log" });
        write({ root: computer_dir, relative: "bots/3/.npm/package.json" });
        write({ root: computer_dir, relative: "bots/3/.bun/install/cache/dep" });
        write({ root: computer_dir, relative: "bots/3/.bun/bin/tool" });
        write({ root: computer_dir, relative: "bots/3/project/node_modules/pkg/index.js" });
        write({ root: computer_dir, relative: "bots/3/project/__pycache__/main.pyc" });
        write({ root: computer_dir, relative: "bots/3/project/main.py" });
        write({ root: computer_dir, relative: "bots/3/.cobble-browser/Default/Cache/data" });
        write({ root: computer_dir, relative: "bots/3/.cobble-browser/Default/Cookies" });
        write({ root: computer_dir, relative: "bots/3/users/1/work.txt" });
        write({ root: computer_dir, relative: "bots/3/users/1/.cache/chromium/data" });
        write({ root: computer_dir, relative: "workspaces/2/designs/a.png" });
        write({ root: computer_dir, relative: "workspaces/2/.cache/pip/wheel" });

        write({ root: profile_dir, relative: "Default/Cache/data" });
        write({ root: profile_dir, relative: "Default/Code Cache/js" });
        write({ root: profile_dir, relative: "GPUCache/data" });
        write({ root: profile_dir, relative: "Default/Cookies" });
        write({ root: profile_dir, relative: "Default/Preferences" });
        write({ root: profile_dir, relative: "SingletonLock" });

        const pruned = await pruneComputerCacheFolders({ computer_dir, profile_dir });
        const in_computer = pruned.filter((entry) => entry.dir.startsWith(`${computer_dir}/`));
        const in_profile = pruned.filter((entry) => entry.dir.startsWith(`${profile_dir}/`));

        expect(in_computer.map((entry) => path.relative(computer_dir, entry.dir)).sort()).toEqual([
            "bots/3/.bun/install/cache",
            "bots/3/.cache",
            "bots/3/.cobble-browser/Default/Cache",
            "bots/3/.npm/_cacache",
            "bots/3/.npm/_logs",
            "bots/3/project/__pycache__",
            "bots/3/users/1/.cache",
            "workspaces/2/.cache",
        ]);

        expect(in_profile.map((entry) => path.relative(profile_dir, entry.dir)).sort()).toEqual([
            "Default/Cache",
            "Default/Code Cache",
            "GPUCache",
        ]);

        /**
         * The caches and bytecode go.
         */
        for (const gone of [
            "bots/3/.cache",
            "bots/3/.npm/_cacache",
            "bots/3/.npm/_logs",
            "bots/3/.bun/install/cache",
            "bots/3/project/__pycache__",
            "bots/3/.cobble-browser/Default/Cache",
            "bots/3/users/1/.cache",
            "workspaces/2/.cache",
        ]) {
            expect(has({ root: computer_dir, relative: gone })).toBe(false);
        }

        /**
         * Work and installs stay: a run still needs its packages, and the
         * profile its logins.
         */
        for (const kept of [
            "bots/3/keep.md",
            "bots/3/.npm/package.json",
            "bots/3/.bun/bin/tool",
            "bots/3/project/node_modules/pkg/index.js",
            "bots/3/project/main.py",
            "bots/3/.cobble-browser/Default/Cookies",
            "bots/3/users/1/work.txt",
            "workspaces/2/designs/a.png",
        ]) {
            expect(has({ root: computer_dir, relative: kept })).toBe(true);
        }

        expect(has({ root: profile_dir, relative: "Default/Cache" })).toBe(false);
        expect(has({ root: profile_dir, relative: "Default/Code Cache" })).toBe(false);
        expect(has({ root: profile_dir, relative: "GPUCache" })).toBe(false);
        expect(has({ root: profile_dir, relative: "Default/Cookies" })).toBe(true);
        expect(has({ root: profile_dir, relative: "Default/Preferences" })).toBe(true);
        expect(has({ root: profile_dir, relative: "SingletonLock" })).toBe(true);
    });

    test("counts what it freed", async () => {
        const computer_dir = makeRoot();
        const profile_dir = makeRoot();

        write({ root: profile_dir, relative: "Default/Cache/data", content: "1234567890" });

        const pruned = await pruneComputerCacheFolders({ computer_dir, profile_dir });

        expect(pruned).toHaveLength(1);
        expect(pruned[0]?.bytes).toBe(10);
    });

    test("a folder with no caches in it is untouched", async () => {
        const computer_dir = makeRoot();
        const profile_dir = makeRoot();

        write({ root: computer_dir, relative: "bots/3/report.md" });

        expect(await pruneComputerCacheFolders({ computer_dir, profile_dir })).toEqual([]);
        expect(has({ root: computer_dir, relative: "bots/3/report.md" })).toBe(true);
    });
});