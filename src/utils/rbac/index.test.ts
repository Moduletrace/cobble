import { describe, expect, test } from "bun:test";
import {
    canCreateUser,
    canListUsers,
    canManageUserTypes,
    canRevokeUser,
    canUpdateUser,
    filterAssignableUserTypes,
    isPassThroughUser,
} from "./";
import {
    ALL_USER_TYPES,
    makeUserTypes,
} from "./user-type-assignment.test-fixtures";

describe("isPassThroughUser", () => {
    test("super_admin is pass-through", () => {
        expect(isPassThroughUser({ user_types: makeUserTypes("super_admin") })).toBe(true);
    });

    test("regular types are not pass-through", () => {
        for (const type of ["admin", "president", "secretary"]) {
            expect(
                isPassThroughUser({ user_types: makeUserTypes(type) }),
            ).toBe(false);
        }
    });
});

describe("canListUsers / canCreateUser / canManageUserTypes", () => {
    test("pass-through always passes", () => {
        for (const fn of [canListUsers, canCreateUser, canManageUserTypes]) {
            expect(
                fn({ user_types: makeUserTypes("super_admin") }),
            ).toBe(true);
        }
    });

    test("admin passes", () => {
        expect(canListUsers({ user_types: makeUserTypes("admin") })).toBe(true);
        expect(canCreateUser({ user_types: makeUserTypes("admin") })).toBe(true);
        expect(
            canManageUserTypes({ user_types: makeUserTypes("admin") }),
        ).toBe(true);
    });

    test("non-admin types fail", () => {
        for (const type of ["auditor", "president", "secretary", "read_only"]) {
            expect(
                canListUsers({ user_types: makeUserTypes(type) }),
            ).toBe(false);
            expect(
                canCreateUser({ user_types: makeUserTypes(type) }),
            ).toBe(false);
            expect(
                canManageUserTypes({ user_types: makeUserTypes(type) }),
            ).toBe(false);
        }
    });
});

describe("canUpdateUser", () => {
    test("actors may update their own record", () => {
        expect(
            canUpdateUser({
                actor_user_types: makeUserTypes("auditor"),
                actor_user_id: 5,
                target_user_id: 5,
            }),
        ).toBe(true);
    });

    test("pass-through may update anyone including contacts", () => {
        expect(
            canUpdateUser({
                actor_user_types: makeUserTypes("super_admin"),
                actor_user_id: 1,
                target_user_id: 2,
                target_user_types: makeUserTypes("super_admin"),
                update_fields: ["email"],
            }),
        ).toBe(true);
    });

    test("admin may edit basic info of others", () => {
        expect(
            canUpdateUser({
                actor_user_types: makeUserTypes("admin"),
                actor_user_id: 1,
                target_user_id: 2,
                update_fields: ["first_name"],
            }),
        ).toBe(true);
    });

    test("admin cannot change contacts of protected users", () => {
        expect(
            canUpdateUser({
                actor_user_types: makeUserTypes("admin"),
                actor_user_id: 1,
                target_user_id: 2,
                target_user_types: makeUserTypes("super_admin"),
                update_fields: ["email"],
            }),
        ).toBe(false);
    });

    test("non-admin actors cannot update others", () => {
        expect(
            canUpdateUser({
                actor_user_types: makeUserTypes("auditor"),
                actor_user_id: 1,
                target_user_id: 2,
                update_fields: ["first_name"],
            }),
        ).toBe(false);
    });
});

describe("canRevokeUser", () => {
    test("super_admin targets can never be revoked", () => {
        expect(
            canRevokeUser({
                user_types: makeUserTypes("super_admin"),
                target_user_types: makeUserTypes("super_admin"),
            }),
        ).toBe(false);
    });

    test("pass-through may revoke anyone else", () => {
        expect(
            canRevokeUser({
                user_types: makeUserTypes("super_admin"),
                target_user_types: makeUserTypes("admin"),
            }),
        ).toBe(true);
    });

    test("admin may revoke revocable targets", () => {
        expect(
            canRevokeUser({
                user_types: makeUserTypes("admin"),
                target_user_types: makeUserTypes("read_only"),
            }),
        ).toBe(true);
    });

    test("admin cannot revoke protected targets", () => {
        expect(
            canRevokeUser({
                user_types: makeUserTypes("admin"),
                target_user_types: makeUserTypes("admin"),
            }),
        ).toBe(false);
        expect(
            canRevokeUser({
                user_types: makeUserTypes("admin"),
                target_user_types: makeUserTypes("president"),
            }),
        ).toBe(false);
    });
});

describe("filterAssignableUserTypes", () => {
    test("super_admin can assign everything", () => {
        const assignable = filterAssignableUserTypes({
            actor_user_types: makeUserTypes("super_admin"),
            user_types: ALL_USER_TYPES,
        });
        expect(assignable).toHaveLength(ALL_USER_TYPES.length);
    });

    test("admin sees only assignable types", () => {
        const assignable = filterAssignableUserTypes({
            actor_user_types: makeUserTypes("admin"),
            user_types: ALL_USER_TYPES,
        });
        expect(assignable).toContain("auditor");
        expect(assignable).toContain("read_only");
        expect(assignable).not.toContain("admin");
        expect(assignable).not.toContain("super_admin");
        expect(assignable).not.toContain("president");
        expect(assignable).not.toContain("secretary");
    });

    test("secretary can assign nothing", () => {
        const assignable = filterAssignableUserTypes({
            actor_user_types: makeUserTypes("secretary"),
            user_types: ALL_USER_TYPES,
        });
        expect(assignable).toHaveLength(0);
    });
});