import { describe, expect, test } from "bun:test";
import canSeeRailItem from "./can-see-rail-item";
import canManageCrew from "./can-manage-crew";
import canListUsers from "./can-list-users";
import { RailPages, UsagePath } from "@/src/dict/rail-pages-dict";

function types(...user_types: string[]) {
    return user_types.map((user_type) => ({ user_type })) as never;
}

const super_admin = types("super_admin");
const admin = types("member", "admin");
const member = types("member");
const read_only = types("read_only");

describe("canSeeRailItem", () => {
    test("a page anyone may open shows to everyone", () => {
        const page = {};

        expect(canSeeRailItem({ item: page, is_super_admin: true, user_types: super_admin })).toBe(true);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: member })).toBe(true);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: read_only })).toBe(true);
    });

    test("a super admin page shows to super admins only", () => {
        const page = { super_admin_only: true };

        expect(canSeeRailItem({ item: page, is_super_admin: true, user_types: super_admin })).toBe(true);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: admin })).toBe(false);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: member })).toBe(false);
    });

    test("an RBAC gate is asked, not guessed from super admin", () => {
        const page = { can_view: canManageCrew };

        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: super_admin })).toBe(true);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: admin })).toBe(true);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: member })).toBe(false);
    });

    test("a can_view rule wins over super_admin_only, so a gate is never widened by it", () => {
        /**
         * The two together should follow the narrower rule the code asked
         * for. No page sets both today, and this keeps a future one from
         * quietly showing to every super admin when its rule says no.
         */
        const page = { can_view: canListUsers, super_admin_only: true };

        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: member })).toBe(false);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: read_only })).toBe(false);
        expect(canSeeRailItem({ item: page, is_super_admin: false, user_types: admin })).toBe(true);
    });
});

describe("RailPages", () => {
    test("usage is a rail page, gated to the crew's managers", () => {
        const usage = RailPages.find((page) => page.url == UsagePath);

        expect(usage?.title).toBe("Usage");
        expect(usage?.can_view).toBeDefined();
        expect(usage?.super_admin_only).toBeFalsy();
    });

    test("activity stays super admin only", () => {
        const activity = RailPages.find((page) => page.url == "/admin/logs");

        expect(activity?.super_admin_only).toBe(true);
    });

    test("a member is offered routines, files and help but not usage or activity", () => {
        const shown = RailPages.filter((page) =>
            canSeeRailItem({ item: page, is_super_admin: false, user_types: member }),
        ).map((page) => page.title);

        expect(shown).toEqual(["Routines", "Files", "Help"]);
    });

    test("an admin is offered usage but still not activity", () => {
        const shown = RailPages.filter((page) =>
            canSeeRailItem({ item: page, is_super_admin: false, user_types: admin }),
        ).map((page) => page.title);

        expect(shown).toEqual(["Routines", "Files", "Usage", "Help"]);
    });
});
