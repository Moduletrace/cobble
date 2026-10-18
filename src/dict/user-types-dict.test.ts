import { describe, expect, test } from "bun:test";
import {
    RolesAdminCantUpdate,
    SuperAdminOnlyEditableUserTypes,
    UneditableUserTypes,
    UserTypes,
    UserTypeAssignmentMatrix,
    UserTypeDeletionMatrix,
} from "./user-types-dict";

describe("UserTypes dict", () => {
    test("has unique values", () => {
        const values = UserTypes.map((ut) => ut.value);
        expect(new Set(values).size).toBe(values.length);
    });

    test("contains required core types", () => {
        const values = new Set(UserTypes.map((ut) => ut.value));
        const required = [
            "super_admin",
            "admin",
            "revoked",
            "read_only",
        ] as const;
        for (const type of required) {
            expect(values.has(type)).toBe(true);
        }
    });

    test("super_admin is uneditable and excluded from admin updates", () => {
        expect(UneditableUserTypes).toContain("super_admin");
        expect(RolesAdminCantUpdate).toContain("super_admin");
        expect(SuperAdminOnlyEditableUserTypes).toContain("revoked");
    });
});

describe("Assignment matrices", () => {
    test("cover every user type", () => {
        for (const ut of UserTypes) {
            expect(UserTypeAssignmentMatrix[ut.value]).toBeDefined();
            expect(UserTypeDeletionMatrix[ut.value]).toBeDefined();
        }
    });

    test("super_admin is only assignable by pass-through actors", () => {
        expect(
            UserTypeAssignmentMatrix["super_admin"].allowed_actors,
        ).toBeUndefined();
    });

    test("elevated types are pass-through only", () => {
        const elevated = [
            "admin",
            "president",
            "vice_president",
            "secretary",
        ] as const;
        for (const type of elevated) {
            const entry = UserTypeAssignmentMatrix[type];
            expect(Array.isArray(entry.allowed_actors)).toBe(true);
            expect((entry.allowed_actors as string[]).length).toBe(0);
        }
    });

    test("admin can manage auditor but not another admin", () => {
        expect(
            UserTypeAssignmentMatrix["auditor"].allowed_actors,
        ).toContain("admin");

        expect(
            (UserTypeAssignmentMatrix["admin"].allowed_actors as string[])
                .length,
        ).toBe(0);
    });
});