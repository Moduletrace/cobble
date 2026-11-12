import { afterEach, describe, expect, test } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import listArchiveExclusions from "./list-archive-exclusions";

const dirs: string[] = [];

function makeDataDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cobble-exclusions-"));

    dirs.push(dir);

    return dir;
}

function write({ root, relative, content = "x" }: { root: string; relative: string; content?: string }) {
    const target = path.join(root, relative);

    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
}

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});

describe("listArchiveExclusions", () => {
    test("leaves out the install's disposable folders and keeps everything else", async () => {
        const root = makeDataDir();

        write({ root, relative: "computers/1/bots/3/users/1/node_modules/pkg/index.js" });
        write({ root, relative: "computer-browsers/1/Default/Cache/data" });
        write({ root, relative: "computer-browsers/1/Default/Code Cache/js" });
        write({ root, relative: "computer-browsers/1/GPUCache/data" });
        write({ root, relative: "computer-browsers/1/Default/Cookies" });
        write({ root, relative: "computer-browsers/1/Default/Preferences" });
        write({ root, relative: "db/.backups/cobble-1" });
        write({ root, relative: "db/cobble" });
        write({ root, relative: ".bun-sqlite/.tmp/temp.db" });
        write({ root, relative: "bots/1/report.md" });

        const excluded = await listArchiveExclusions({ data_dir: root });

        expect(excluded.sort()).toEqual([
            "./.bun-sqlite",
            "./computer-browsers/1/Default/Cache",
            "./computer-browsers/1/Default/Code Cache",
            "./computer-browsers/1/GPUCache",
            "./computers",
            "./db/.backups",
        ]);
    });

    test("lists only what is there", async () => {
        const root = makeDataDir();

        write({ root, relative: "bots/1/report.md" });

        expect(await listArchiveExclusions({ data_dir: root })).toEqual([]);
    });

    test("a profile's logins and preferences stay", async () => {
        const root = makeDataDir();

        write({ root, relative: "computer-browsers/2/Profile 1/Cache/data" });
        write({ root, relative: "computer-browsers/2/Profile 1/Login Data" });
        write({ root, relative: "computer-browsers/2/Default/Extensions/abc/manifest.json" });

        const excluded = await listArchiveExclusions({ data_dir: root });

        expect(excluded).toEqual(["./computer-browsers/2/Profile 1/Cache"]);
    });
});