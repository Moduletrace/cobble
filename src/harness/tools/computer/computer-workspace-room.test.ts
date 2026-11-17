import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import { ComputerWorkspaceQuotaSettingKey } from "@/src/dict/computer-dict";

const MB = 1024 * 1024;

/**
 * The saved quota and the computer's reported usage, swapped per test so the
 * warning can be driven without a real computer. The quota module itself
 * stays real (its named exports have their own test); only the setting it
 * reads is mocked.
 */
let saved_mb: string | undefined;
let usage: { used_bytes: number; folders?: never[] } | null = null;

mock.module("@/src/functions/backend/db/app-settings/grab-app-setting", () => ({
    default: async ({ key }: { key: string }) => (key == ComputerWorkspaceQuotaSettingKey ? saved_mb : undefined),
}));

mock.module("@/src/functions/backend/computers/grab-computer-usage", () => ({
    default: async () => usage,
}));

const { workspaceHasRoom, computerWorkspaceFullWarning } = await import("./computer-workspace-room");

afterAll(() => {
    mock.restore();
});

beforeEach(() => {
    saved_mb = undefined;
    usage = null;
});

const computer = {} as ComputerApi;
const dirs = { cwd: "/home/cb-9/workspace", bot_dir: "/home/cb-9/workspace/bots/9" } as ComputerRunDirs;

/**
 * The check the two write tools make before writing: a wrong sum either
 * refuses a write that fits, or lets a bot fill the computer's volume.
 */
describe("workspaceHasRoom", () => {
    test("lets a write land at or under the limit", () => {
        expect(workspaceHasRoom({ used_bytes: 0, quota_bytes: 10 * MB, incoming_bytes: MB })).toBe(true);
        expect(workspaceHasRoom({ used_bytes: 9 * MB, quota_bytes: 10 * MB, incoming_bytes: MB })).toBe(true);
    });

    test("refuses a write that would pass it", () => {
        expect(workspaceHasRoom({ used_bytes: 9 * MB, quota_bytes: 10 * MB, incoming_bytes: MB + 1 })).toBe(false);
        expect(workspaceHasRoom({ used_bytes: 50 * MB, quota_bytes: 10 * MB, incoming_bytes: 1 })).toBe(false);
    });

    test("a quota of 0 sets no limit", () => {
        expect(workspaceHasRoom({ used_bytes: 900 * MB, quota_bytes: 0, incoming_bytes: MB })).toBe(true);
    });

    test("a shrinking write always fits, even over the limit", () => {
        expect(workspaceHasRoom({ used_bytes: 20 * MB, quota_bytes: 10 * MB, incoming_bytes: -5 * MB })).toBe(true);
        expect(workspaceHasRoom({ used_bytes: 10 * MB, quota_bytes: 10 * MB, incoming_bytes: -5 * MB })).toBe(true);
        expect(workspaceHasRoom({ used_bytes: 20 * MB, quota_bytes: 10 * MB, incoming_bytes: 0 })).toBe(true);
    });
});

/**
 * The line added after a shell or browser call that wrote files: it reports
 * what is already on disk, so it must fire whenever the workspace is over the
 * limit. Asking `workspaceHasRoom` with `incoming_bytes: 0` could never fire
 * (a write of nothing always fits), which left the warning dead (H2).
 */
describe("computerWorkspaceFullWarning", () => {
    test("fires when the workspace is over the limit", async () => {
        saved_mb = "10";
        usage = { used_bytes: 20 * MB };

        const warning = await computerWorkspaceFullWarning({ computer, dirs });

        expect(warning).not.toBeNull();
        expect(warning).toContain("20.0 MB");
        expect(warning).toContain("10.0 MB");
    });

    test("stays silent at or under the limit", async () => {
        saved_mb = "10";
        usage = { used_bytes: 10 * MB };
        expect(await computerWorkspaceFullWarning({ computer, dirs })).toBeNull();

        usage = { used_bytes: 5 * MB };
        expect(await computerWorkspaceFullWarning({ computer, dirs })).toBeNull();
    });

    test("stays silent when the install sets no limit", async () => {
        saved_mb = "0";
        usage = { used_bytes: 900 * MB };
        expect(await computerWorkspaceFullWarning({ computer, dirs })).toBeNull();
    });

    test("stays silent when the computer won't report its usage", async () => {
        saved_mb = "10";
        usage = null;
        expect(await computerWorkspaceFullWarning({ computer, dirs })).toBeNull();
    });
});
