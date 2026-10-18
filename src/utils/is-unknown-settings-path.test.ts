import { describe, expect, test } from "bun:test";
import isUnknownSettingsPath from "./is-unknown-settings-path";

describe("isUnknownSettingsPath", () => {
    test("known settings pages and the settings root are not unknown", () => {
        expect(isUnknownSettingsPath({ pathname: "/admin/settings" })).toBe(false);
        expect(isUnknownSettingsPath({ pathname: "/admin/settings/" })).toBe(false);
        expect(
            isUnknownSettingsPath({ pathname: "/admin/settings/profile" }),
        ).toBe(false);
        expect(
            isUnknownSettingsPath({ pathname: "/admin/settings/change-password/" }),
        ).toBe(false);
    });

    test("other settings paths are unknown; non-settings paths are not", () => {
        expect(
            isUnknownSettingsPath({ pathname: "/admin/settings/password" }),
        ).toBe(true);
        expect(
            isUnknownSettingsPath({ pathname: "/admin/settings/profilex" }),
        ).toBe(true);
        expect(isUnknownSettingsPath({ pathname: "/admin/bots/1" })).toBe(false);
    });
});
