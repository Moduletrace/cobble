import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import { AppData } from "@/src/data/app-data";
import { ComputerWorkspaceQuotaSettingKey } from "@/src/dict/computer-dict";
import type { ComputerFileStat } from "@/src/functions/backend/computers/stat-computer-file";
import computerRunDirs from "@/src/utils/computer-work-dirs";

/**
 * `export_file` is the way back for a source a rebuild took off the
 * computer: it copies one of the bot's own files there, base64 and whole,
 * charged against the workspace only for what it adds.
 */
let file: { id: number; name: string; path: string; media: { media_write_path: string } | null } | null = null;
let stat: ComputerFileStat = { exists: false };
let saved_mb: string | undefined;
let usage: { used_bytes: number } | null = null;
const writes: Array<{ path: string; content: Buffer }> = [];
const dir = mkdtempSync(path.join(tmpdir(), "export-file-"));
/**
 * The rows point at `media/stored.png` inside a data directory of the
 * test's own: the real `mediaFilePath` resolves it, so the reach rule and
 * the byte read are the ones a run gets.
 */
const stored = path.join(dir, "media", "stored.png");
const previous_data_dir = process.env.DATA_DIR;

beforeAll(() => {
    mkdirSync(path.dirname(stored), { recursive: true });
    process.env.DATA_DIR = dir;
});

mock.module("@/src/functions/backend/db/bot-files/grab-bot-file", () => ({
    default: async () => file,
}));
mock.module("@/src/functions/backend/db/app-settings/grab-app-setting", () => ({
    default: async ({ key }: { key: string }) => (key == ComputerWorkspaceQuotaSettingKey ? saved_mb : undefined),
}));
mock.module("@/src/functions/backend/computers/grab-computer-usage", () => ({
    default: async () => usage,
}));
mock.module("@/src/functions/backend/computers/stat-computer-file", () => ({
    default: async () => stat,
}));
mock.module("@/src/functions/backend/computers/write-computer-file", () => ({
    default: async ({ path, content }: { path: string; content: Buffer }) => {
        writes.push({ path, content });

        return { ok: true, size: content.length };
    },
}));

afterAll(() => {
    mock.restore();

    if (previous_data_dir == undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = previous_data_dir;

    rmSync(dir, { recursive: true, force: true });
});

const computer = {} as ComputerApi;
const dirs = computerRunDirs({ bot_id: 8, bot_kind: "worker", user_id: 1, workspace_id: null });
const MB = 1024 * 1024;

async function exportTo(computer_path = "sources/summit.png") {
    const { default: make } = await import("./export-file-tool");
    const tool = make({ computer, dirs, scopes: [] });

    return tool.run({ args: { file_id: 313, path: computer_path }, signal: new AbortController().signal });
}

describe("exportFileTool", () => {
    test("copies the bytes onto the computer, whole", async () => {
        writeFileSync(stored, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: { media_write_path: "media/stored.png" } };
        stat = { exists: false };
        saved_mb = "0";
        usage = null;
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("Copied summit.png");
        expect(result).toContain(`${dirs.cwd}/sources/summit.png`);
        expect(result).toContain("new file");
        expect(writes.length).toBe(1);
        expect(Array.from(writes[0]!.content)).toEqual([0x89, 0x50, 0x4e, 0x47]);
    });

    test("says what it replaced", async () => {
        writeFileSync(stored, Buffer.from("hello"));
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: { media_write_path: "media/stored.png" } };
        stat = { exists: true, type: "file", size: 9000, mtime_ms: 0 };
        saved_mb = "0";
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("replaced");
        expect(result).toContain("8.8 KB");
    });

    test("a file the run can't reach is named as unknown", async () => {
        file = null;
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("No file matches that");
        expect(writes.length).toBe(0);
    });

    test("a row with no stored bytes says so", async () => {
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: null };
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("No file matches that");
        expect(writes.length).toBe(0);
    });

    test("a row whose bytes were cleaned up says so", async () => {
        rmSync(stored, { force: true });
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: { media_write_path: "media/stored.png" } };
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("missing on the server");
        expect(writes.length).toBe(0);
    });

    test("a file over the cap is refused, naming a way through", async () => {
        writeFileSync(stored, Buffer.alloc(AppData.BotFileExportMaxBytes + 1));
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: { media_write_path: "media/stored.png" } };
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("transform_image");
        expect(writes.length).toBe(0);
    });

    test("a copy that would fill the workspace is refused", async () => {
        writeFileSync(stored, Buffer.alloc(2000));
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: { media_write_path: "media/stored.png" } };
        stat = { exists: false };
        saved_mb = "10";
        usage = { used_bytes: 10 * MB };
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("No room left");
        expect(writes.length).toBe(0);
    });

    test("a copy over a file the same size adds nothing to the workspace", async () => {
        writeFileSync(stored, Buffer.alloc(2000));
        file = { id: 313, name: "summit.png", path: "uploads/summit.png", media: { media_write_path: "media/stored.png" } };
        stat = { exists: true, type: "file", size: 2000, mtime_ms: 0 };
        saved_mb = "10";
        usage = { used_bytes: 10 * MB };
        writes.length = 0;

        const result = await exportTo();

        expect(result).toContain("Copied");
        expect(writes.length).toBe(1);
    });
});