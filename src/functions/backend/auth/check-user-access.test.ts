import { describe, expect, test } from "bun:test";
import checkUserAccess from "./check-user-access";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";

function makeUserTypes(...types: string[]): BUN_SQLITE_COBBLE_USER_TYPES[] {
    return types.map((user_type) => ({
        user_id: 1,
        user_type,
    }));
}

describe("checkUserAccess", () => {
    test("fails with null, undefined or empty user_types", () => {
        expect(
            checkUserAccess({ user_types: null }).success,
        ).toBe(false);
        expect(
            checkUserAccess({ user_types: undefined }).success,
        ).toBe(false);
        expect(checkUserAccess({ user_types: [] }).success).toBe(false);
    });

    test("super_admin always passes", () => {
        expect(
            checkUserAccess({
                user_types: makeUserTypes("super_admin"),
                includes: ["admin"],
            }).success,
        ).toBe(true);

        expect(
            checkUserAccess({
                user_types: makeUserTypes("super_admin", "revoked"),
                excludes: ["revoked"],
            }).success,
        ).toBe(true);
    });

    test("excludes take priority over includes", () => {
        const res = checkUserAccess({
            user_types: makeUserTypes("admin"),
            includes: ["admin"],
            excludes: ["admin"],
        });

        expect(res.success).toBe(false);
        expect(res.msg).toBe(`User Excluded`);
    });

    test("includes require a match", () => {
        const res = checkUserAccess({
            user_types: makeUserTypes("board_member"),
            includes: ["admin"],
        });

        expect(res.success).toBe(false);
        expect(res.msg).toBe(`User not included`);
    });

    test("includes match with OR semantics", () => {
        expect(
            checkUserAccess({
                user_types: makeUserTypes("member"),
                includes: ["admin", "member"],
            }).success,
        ).toBe(true);
    });

    test("fails when no includes or excludes are provided", () => {
        const res = checkUserAccess({
            user_types: makeUserTypes("admin"),
        });

        expect(res.success).toBe(false);
        expect(res.msg).toBe(`No includes or excludes provided`);
    });
});