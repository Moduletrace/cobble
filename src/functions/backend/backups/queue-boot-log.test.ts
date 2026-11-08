import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { AppData } from "@/src/data/app-data";
import queueBootLog from "./queue-boot-log";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cobble-boot-log-"));
const previous = process.env.DATA_DIR;
const file_path = path.join(dir, AppData.PendingBootLogsFile);

beforeAll(() => {
    process.env.DATA_DIR = dir;
});

afterAll(() => {
    if (previous === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previous;
    fs.rmSync(dir, { recursive: true, force: true });
});

describe("queueBootLog", () => {
    test("keeps entries in order across calls", () => {
        queueBootLog({
            entry: { title: "One", category: "system", plain_text: "first" },
        });
        queueBootLog({
            entry: { title: "Two", category: "system", plain_text: "second" },
        });

        const entries = JSON.parse(fs.readFileSync(file_path, "utf-8"));

        expect(entries.map((entry: { title: string }) => entry.title)).toEqual([
            "One",
            "Two",
        ]);
    });

    test("starts over from a broken file", () => {
        fs.writeFileSync(file_path, "{not json");

        queueBootLog({
            entry: { title: "Three", category: "system", plain_text: "third" },
        });

        const entries = JSON.parse(fs.readFileSync(file_path, "utf-8"));

        expect(entries).toHaveLength(1);
        expect(entries[0].title).toBe("Three");
    });
});
