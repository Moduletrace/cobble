import { describe, expect, test } from "bun:test";
import type { HostDirectoryCheck } from "@/src/types";
import hostDirectoryCheckStale from "./host-directory-check-stale";

const check = (uids: number[]): HostDirectoryCheck => ({
    accounts: uids.map((uid) => ({ name: `bot #${uid}`, uid, readable: true, writable: true })),
    checked_at: Date.now(),
});

describe("hostDirectoryCheckStale", () => {
    test("a check that covers every account now is not stale", () => {
        expect(hostDirectoryCheckStale({ check: check([1000, 100004]), uids: [1000, 100004] })).toBe(false);
    });

    test("a bot added after the check makes it stale", () => {
        expect(hostDirectoryCheckStale({ check: check([1000]), uids: [1000, 100006] })).toBe(true);
    });

    test("one more account than expected is not stale", () => {
        expect(hostDirectoryCheckStale({ check: check([1000, 100004]), uids: [1000] })).toBe(false);
    });

    test("a folder that was never checked is not stale, it is unchecked", () => {
        expect(hostDirectoryCheckStale({ check: null, uids: [1000] })).toBe(false);
        expect(hostDirectoryCheckStale({ uids: [1000] })).toBe(false);
    });

    test("no accounts expected means nothing to miss", () => {
        expect(hostDirectoryCheckStale({ check: check([1000]), uids: [] })).toBe(false);
    });
});