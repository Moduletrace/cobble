import { afterAll, describe, expect, mock, test } from "bun:test";
import type { ComputerApi } from "@/src/functions/backend/computers/computer-fetch";
import type { ComputerFileStat } from "@/src/functions/backend/computers/stat-computer-file";
import computerRunDirs from "@/src/utils/computer-work-dirs";

/**
 * The reconciliation a task run opens with: a source a rebuild took off the
 * computer is named back to the run with the file that still has it, so it
 * never searches the machine (or the user's accounts) for it.
 */
let stat: ComputerFileStat | Error = { exists: false };
let saved: Array<{ id: number; name: string; path: string }> = [];

mock.module("@/src/functions/backend/computers/stat-computer-file", () => ({
    default: async () => {
        if (stat instanceof Error) throw stat;

        return stat;
    },
}));
mock.module("@/src/functions/backend/db/bot-files/list-bot-files", () => ({
    default: async () => saved,
}));

afterAll(() => {
    mock.restore();
});

const computer = {} as ComputerApi;
const dirs = computerRunDirs({ bot_id: 8, bot_kind: "worker", user_id: 1, workspace_id: null });
const brief = "Build a layered PSD from uploads/2026-11/summit-canva-v1.png, keeping the layers.";

async function note(text = brief) {
    const { default: namedFilesNote } = await import("./named-files-note");

    return namedFilesNote({ computer, dirs, scopes: [], text });
}

describe("namedFilesNote", () => {
    test("names the saved file a rebuild took off the computer", async () => {
        stat = { exists: false };
        saved = [{ id: 313, name: "summit-canva-v1.png", path: "uploads/2026-11/summit-canva-v1.png" }];

        const result = await note();

        expect(result).toContain("uploads/2026-11/summit-canva-v1.png");
        expect(result).toContain("[file:313]");
        expect(result).toContain("export_file");
    });

    test("says plainly not to look for one there is no copy of", async () => {
        stat = { exists: false };
        saved = [];

        const result = await note();

        expect(result).toContain("not on this computer");
        expect(result).toContain("don't go looking");
        expect(result).not.toContain("[file:");
    });

    test("says a file is there, without pointing anywhere", async () => {
        stat = { exists: true, type: "file", size: 1000, mtime_ms: 0 };
        saved = [{ id: 313, name: "summit-canva-v1.png", path: "uploads/2026-11/summit-canva-v1.png" }];

        const result = await note();

        expect(result).toContain("there now");
        expect(result).not.toContain("[file:313]");
    });

    test("says nothing when the computer won't answer", async () => {
        stat = new Error("down");

        expect(await note()).toBe("");
    });

    test("says nothing when the brief names no files", async () => {
        stat = { exists: false };

        expect(await note("Write up the audit.")).toBe("");
    });
});