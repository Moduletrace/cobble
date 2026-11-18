import { describe, expect, test } from "bun:test";
import type { HostDirectoryCheck } from "@/src/types";
import hostDirectoryCheckState from "./host-directory-check-state";
import hostDirectoryLinkState from "./host-directory-link-state";

const check = (accounts: { readable: boolean; writable: boolean }[]): HostDirectoryCheck => ({
    accounts: accounts.map((account, index) => ({
        bot_id: index + 2,
        name: `bot #${index + 2}`,
        uid: 100_000 + index,
        ...account,
    })),
    checked_at: 1,
    error: null,
});

describe("hostDirectoryCheckState", () => {
    test("nothing checked is unknown", () => {
        expect(hostDirectoryCheckState({ access: "read-write", check: null })).toBe("unknown");
        expect(hostDirectoryCheckState({ access: "read-write", check: check([]) })).toBe("unknown");
    });

    test("everyone writing is writable", () => {
        expect(hostDirectoryCheckState({ access: "read-write", check: check([{ readable: true, writable: true }]) })).toBe("writable");
    });

    test("some writing is partial", () => {
        expect(
            hostDirectoryCheckState({
                access: "read-write",
                check: check([{ readable: true, writable: true }, { readable: true, writable: false }]),
            })
        ).toBe("partial");
    });

    test("none writing is read only", () => {
        expect(hostDirectoryCheckState({ access: "read-write", check: check([{ readable: true, writable: false }]) })).toBe("read-only");
    });

    test("a read-only link only asks that they can read", () => {
        expect(hostDirectoryCheckState({ access: "read-only", check: check([{ readable: true, writable: false }]) })).toBe("read-only");
        expect(hostDirectoryCheckState({ access: "read-only", check: check([{ readable: true, writable: true }]) })).toBe("read-only");
    });

    test("none reading is missing, some is partial", () => {
        expect(hostDirectoryCheckState({ access: "read-only", check: check([{ readable: false, writable: false }]) })).toBe("missing");
        expect(
            hostDirectoryCheckState({
                access: "read-only",
                check: check([{ readable: true, writable: false }, { readable: false, writable: false }]),
            })
        ).toBe("partial");
    });
});

describe("hostDirectoryLinkState", () => {
    test("no check is unknown", () => {
        expect(hostDirectoryLinkState({ access: "read-write", checks: [] })).toBe("unknown");
        expect(hostDirectoryLinkState({ access: "read-write", checks: [null] })).toBe("unknown");
    });

    test("the worst computer decides", () => {
        expect(
            hostDirectoryLinkState({
                access: "read-write",
                checks: [
                    check([{ readable: true, writable: true }]),
                    check([{ readable: true, writable: false }]),
                ],
            })
        ).toBe("read-only");

        expect(
            hostDirectoryLinkState({
                access: "read-write",
                checks: [
                    check([{ readable: true, writable: false }]),
                    check([{ readable: false, writable: false }]),
                ],
            })
        ).toBe("missing");
    });

    test("all writable is writable", () => {
        expect(
            hostDirectoryLinkState({
                access: "read-write",
                checks: [check([{ readable: true, writable: true }]), check([{ readable: true, writable: true }])],
            })
        ).toBe("writable");
    });
});