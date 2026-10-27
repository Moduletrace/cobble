import { describe, expect, test } from "bun:test";
import isRaillessPage from "./is-railless-page";

describe("isRaillessPage", () => {
    test("a graphic's own page has no rail", () => {
        expect(isRaillessPage({ pathname: "/admin/bots/3/graphics/5" })).toBe(true);
        expect(isRaillessPage({ pathname: "/admin/bots/3/graphics/5/" })).toBe(true);
    });

    test("every other page keeps it", () => {
        expect(isRaillessPage({ pathname: "/admin/bots/3" })).toBe(false);
        expect(isRaillessPage({ pathname: "/admin/bots/3/graphics" })).toBe(false);
        expect(isRaillessPage({ pathname: "/admin/settings/general" })).toBe(false);
        expect(isRaillessPage({ pathname: undefined })).toBe(false);
    });
});
