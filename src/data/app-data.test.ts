import { describe, expect, test } from "bun:test";
import { AppData } from "./app-data";
import { SiteData } from "./site-data";

describe("AppData auth constants", () => {
    test("cookie names are derived from the site slug", () => {
        expect(AppData["AuthKeyCookieName"]).toBe(
            `${SiteData["SiteSlug"]}_auth_key`,
        );
        expect(AppData["AuthCSRFCookieName"]).toBe(
            `${SiteData["SiteSlug"]}_auth_csrf`,
        );
        expect(AppData["SSOAuthCookieName"]).toBe(
            `${SiteData["SiteSlug"]}_sso_auth`,
        );
    });

    test("expiry and limits are positive", () => {
        expect(AppData["AuthExpiryDays"]).toBeGreaterThan(0);
        expect(AppData["SSOCodeExpiryMinutes"]).toBeGreaterThan(0);
        expect(AppData["DefaultQueryLimit"]).toBeGreaterThan(0);
    });

    test("has a configured health message", () => {
        expect(AppData["ServerHealthMessage"]).toBeTruthy();
    });
});