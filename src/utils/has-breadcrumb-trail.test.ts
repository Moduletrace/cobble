import { describe, expect, test } from "bun:test";
import hasBreadcrumbTrail from "./has-breadcrumb-trail";

describe("hasBreadcrumbTrail", () => {
    test("a top-level page has one, so a lone page never goes without", () => {
        expect(hasBreadcrumbTrail({ pathname: "/admin/routines" })).toBe(true);
    });

    test("a nested page has one", () => {
        expect(hasBreadcrumbTrail({ pathname: "/admin/settings/general" })).toBe(
            true,
        );
        expect(hasBreadcrumbTrail({ pathname: "/admin/settings/bots/3" })).toBe(
            true,
        );
    });

    test("the crew of bots is home, so it has none", () => {
        expect(hasBreadcrumbTrail({ pathname: "/admin/bots" })).toBe(false);
        expect(hasBreadcrumbTrail({ pathname: "/admin/bots/" })).toBe(false);
    });

    test("the address that only redirects to home has none either", () => {
        expect(hasBreadcrumbTrail({ pathname: "/admin" })).toBe(false);
        expect(hasBreadcrumbTrail({ pathname: "/admin/" })).toBe(false);
    });

    test("a folder in the files browser keeps the trail of its page", () => {
        expect(
            hasBreadcrumbTrail({
                pathname: "/admin/files?volume=bot&owner=1&path=reports",
            }),
        ).toBe(true);
    });

    test("nothing outside the admin pages has one", () => {
        expect(hasBreadcrumbTrail({ pathname: "/auth/login" })).toBe(false);
        expect(hasBreadcrumbTrail({ pathname: "/" })).toBe(false);
        expect(hasBreadcrumbTrail({ pathname: "" })).toBe(false);
        expect(hasBreadcrumbTrail({})).toBe(false);
        expect(hasBreadcrumbTrail({ pathname: null })).toBe(false);
    });

    test("a path that merely starts like admin does not count", () => {
        expect(hasBreadcrumbTrail({ pathname: "/administrator" })).toBe(false);
    });
});
