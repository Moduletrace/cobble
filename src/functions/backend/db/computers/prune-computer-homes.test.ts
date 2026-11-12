import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AppData } from "@/src/data/app-data";
import pruneComputerHomes from "./prune-computer-homes";

/**
 * These folders are never archived and nothing mounts them, so this is the
 * only thing that ever removes them: too eager loses a computer's old home
 * before anyone looked, too shy fills the data volume for good.
 */
const DayMs = 24 * 60 * 60 * 1000;
const Old = Date.now() - (AppData.ComputerOldHomeKeepDays + 5) * DayMs;
const New = Date.now() - DayMs;

const roots: string[] = [];
const previous_data_dir = process.env.DATA_DIR;

function setup({ folders }: { folders: { name: string; stamp: number; touched: number }[] }) {
    const data_dir = mkdtempSync(path.join(tmpdir(), "cobble-homes-"));

    roots.push(data_dir);
    process.env.DATA_DIR = data_dir;

    const computers = path.join(data_dir, AppData.ComputerDataDir);

    mkdirSync(computers, { recursive: true });

    for (const folder of folders) {
        const target = path.join(computers, folder.name);

        mkdirSync(target, { recursive: true });
        writeFileSync(path.join(target, "keep.txt"), "x");
        utimesSync(target, new Date(folder.touched), new Date(folder.touched));
    }

    return { data_dir, computers };
}

afterEach(() => {
    for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });

    if (previous_data_dir == undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previous_data_dir;
});

describe("pruneComputerHomes", () => {
    test("takes the folders moved aside long ago, keeps everything else", async () => {
        const { computers } = setup({
            folders: [
                { name: "1", stamp: Old, touched: Old },
                { name: "1-home-1700000000000", stamp: Old, touched: Old },
                { name: "2-1700000000000", stamp: Old, touched: Old },
                { name: "3-home-1700000000000", stamp: New, touched: New },
            ],
        });

        writeFileSync(path.join(computers, "notes.txt"), "x");

        expect((await pruneComputerHomes()).sort()).toEqual(["1-home-1700000000000", "2-1700000000000"]);
        expect(readdirSync(computers).sort()).toEqual(["1", "3-home-1700000000000", "notes.txt"]);
    });

    test("a folder whose own time is recent is kept, whatever its name says", async () => {
        const { computers } = setup({
            folders: [{ name: "4-home-1700000000000", stamp: Old, touched: Date.now() }],
        });

        expect(await pruneComputerHomes()).toEqual([]);
        expect(readdirSync(computers)).toEqual(["4-home-1700000000000"]);
    });

    test("no computers folder at all is not a failure", async () => {
        process.env.DATA_DIR = path.join(tmpdir(), "cobble-homes-missing");

        expect(await pruneComputerHomes()).toEqual([]);
    });
});