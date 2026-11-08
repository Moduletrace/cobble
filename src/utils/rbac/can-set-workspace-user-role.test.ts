import { describe, expect, test } from "bun:test";
import canSetWorkspaceUserRole from "./can-set-workspace-user-role";

const types = (...user_types: string[]) => user_types.map((user_type) => ({ user_type }));

describe("canSetWorkspaceUserRole", () => {
    test("the super admin sets anyone's role, their own too", () => {
        expect(canSetWorkspaceUserRole({ actor_user_types: types("super_admin"), target_user_types: types("super_admin") })).toBe(true);
        expect(canSetWorkspaceUserRole({ actor_user_types: types("super_admin"), target_user_types: types("admin") })).toBe(true);
        expect(canSetWorkspaceUserRole({ actor_user_types: types("super_admin"), target_user_types: types("member") })).toBe(true);
    });

    test("an admin sets admins' and members' roles, never a super admin's", () => {
        expect(canSetWorkspaceUserRole({ actor_user_types: types("admin"), target_user_types: types("member") })).toBe(true);
        expect(canSetWorkspaceUserRole({ actor_user_types: types("admin"), target_user_types: types("admin") })).toBe(true);
        expect(canSetWorkspaceUserRole({ actor_user_types: types("admin"), target_user_types: types("super_admin") })).toBe(false);
        expect(canSetWorkspaceUserRole({ actor_user_types: types("admin"), target_user_types: types("super_admin", "admin") })).toBe(false);
    });

    test("members never set a role, not even their own", () => {
        expect(canSetWorkspaceUserRole({ actor_user_types: types("member"), target_user_types: types("member") })).toBe(false);
        expect(canSetWorkspaceUserRole({ actor_user_types: types("read_only"), target_user_types: types("member") })).toBe(false);
        expect(canSetWorkspaceUserRole({ actor_user_types: [], target_user_types: types("member") })).toBe(false);
    });
});
