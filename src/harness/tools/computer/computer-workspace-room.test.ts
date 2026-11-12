import { describe, expect, test } from "bun:test";
import { workspaceHasRoom } from "./computer-workspace-room";

const MB = 1024 * 1024;

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