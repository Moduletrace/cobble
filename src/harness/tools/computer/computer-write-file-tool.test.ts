import { afterAll, describe, expect, mock, test } from "bun:test";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import type { ComputerFileStat } from "@/src/functions/backend/computers/stat-computer-file";
import computerRunDirs from "@/src/utils/computer-work-dirs";
import { ComputerWorkspaceQuotaSettingKey } from "@/src/dict/computer-dict";

/**
 * M7: a rewrite is charged only for what it grows by, not its whole new
 * content. Counting the whole file refused a same-size or shrinking rewrite
 * near the limit, blocking the cleanup that frees space. The saved quota and
 * the computer's usage are mocked (the quota module itself stays real, so its
 * named exports keep working for its own test) and the real
 * `computerWorkspaceRoomError` makes the call.
 */
let saved_mb: string | undefined;
let usage: { used_bytes: number; folders?: never[] } | null = null;
let stat: ComputerFileStat = { exists: false };
const writes: Array<{ path: string; content: string }> = [];

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
    default: async ({ path, content }: { path: string; content: string }) => {
        writes.push({ path, content });
        return { size: Buffer.byteLength(content, "utf8") };
    },
}));

afterAll(() => {
    mock.restore();
});

const computer = {} as ComputerApi;
const dirs = computerRunDirs({ bot_id: 9, bot_kind: "worker", user_id: 1, workspace_id: null });
const MB = 1024 * 1024;

async function write(content: string) {
    const { default: make } = await import("./computer-write-file-tool");
    const tool = make({
        computer,
        computer_id: 1,
        dirs,
        shell_path: "/home/cb-9/.cobble/env",
        redact: (text) => text,
        bot_id: 9,
        workspace_id: null,
        session_id: 1,
    });
    return tool.run({ args: { path: "report.md", content }, signal: new AbortController().signal });
}

describe("computerWriteFileTool quota growth", () => {
    test("a same-size rewrite at the limit is allowed", async () => {
        saved_mb = "10";
        usage = { used_bytes: 10 * MB };
        stat = { exists: true, type: "file", size: 1000, mtime_ms: 0 };
        writes.length = 0;

        const result = await write("x".repeat(1000));

        expect(result).toContain("Wrote");
        expect(writes.length).toBe(1);
    });

    test("a shrinking rewrite over the limit is allowed", async () => {
        saved_mb = "10";
        usage = { used_bytes: 11 * MB };
        stat = { exists: true, type: "file", size: 5000, mtime_ms: 0 };
        writes.length = 0;

        const result = await write("x".repeat(1000));

        expect(result).toContain("Wrote");
        expect(writes.length).toBe(1);
    });

    test("a new file past the limit is refused", async () => {
        saved_mb = "10";
        usage = { used_bytes: 10 * MB };
        stat = { exists: false };
        writes.length = 0;

        const result = await write("x".repeat(1000));

        expect(result).toContain("No room left");
        expect(writes.length).toBe(0);
    });

    test("a rewrite that grows past the limit is refused", async () => {
        saved_mb = "10";
        usage = { used_bytes: 10 * MB };
        stat = { exists: true, type: "file", size: 500, mtime_ms: 0 };
        writes.length = 0;

        const result = await write("x".repeat(2000));

        expect(result).toContain("No room left");
        expect(writes.length).toBe(0);
    });

    test("a rewrite whose growth still fits is allowed", async () => {
        saved_mb = "10";
        usage = { used_bytes: 9 * MB };
        stat = { exists: true, type: "file", size: 500, mtime_ms: 0 };
        writes.length = 0;

        const result = await write("x".repeat(2000));

        expect(result).toContain("Wrote");
        expect(writes.length).toBe(1);
    });
});