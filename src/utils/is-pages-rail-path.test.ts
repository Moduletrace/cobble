import { describe, expect, test } from "bun:test";
import isPagesRailPath from "./is-pages-rail-path";

describe("isPagesRailPath", () => {
    test("settings and the rail pages", () => {
        expect(isPagesRailPath({ pathname: "/admin/settings" })).toBe(true);
        expect(isPagesRailPath({ pathname: "/admin/settings/general" })).toBe(true);
        expect(isPagesRailPath({ pathname: "/admin/usage" })).toBe(true);
        expect(isPagesRailPath({ pathname: "/admin/routines" })).toBe(true);
        expect(isPagesRailPath({ pathname: "/admin/files/bots" })).toBe(true);
        expect(isPagesRailPath({ pathname: "/admin/logs" })).toBe(true);
    });

    test("not the crew's pages", () => {
        expect(isPagesRailPath({})).toBe(false);
        expect(isPagesRailPath({ pathname: "/admin/bots/3" })).toBe(false);
        expect(isPagesRailPath({ pathname: "/admin/workspaces/2/bots/3" })).toBe(false);
        expect(isPagesRailPath({ pathname: "/admin/settingsx" })).toBe(false);
        expect(isPagesRailPath({ pathname: "/admin/usagex" })).toBe(false);
    });
});
