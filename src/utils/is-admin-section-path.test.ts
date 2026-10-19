import { describe, expect, test } from "bun:test";
import isAdminSectionPath from "./is-admin-section-path";

describe("isAdminSectionPath", () => {
    test("allows live sections and their sub pages", () => {
        expect(isAdminSectionPath({ pathname: "/admin/bots" })).toBe(true);
        expect(isAdminSectionPath({ pathname: "/admin/bots/3" })).toBe(true);
        expect(isAdminSectionPath({ pathname: "/admin/workspaces/2/bots/1" })).toBe(true);
        expect(isAdminSectionPath({ pathname: "/admin/routines" })).toBe(true);
        expect(isAdminSectionPath({ pathname: "/admin/logs" })).toBe(true);
        expect(isAdminSectionPath({ pathname: "/admin/help" })).toBe(true);
        expect(isAdminSectionPath({ pathname: "/admin/settings/change-password" })).toBe(
            true,
        );
    });

    test("rejects the admin root, closed sections and lookalikes", () => {
        expect(isAdminSectionPath({ pathname: "/admin" })).toBe(false);
        expect(isAdminSectionPath({ pathname: "/admin/people" })).toBe(false);
        expect(isAdminSectionPath({ pathname: "/admin/backups" })).toBe(false);
        expect(isAdminSectionPath({ pathname: "/admin/botsx" })).toBe(false);
    });
});
