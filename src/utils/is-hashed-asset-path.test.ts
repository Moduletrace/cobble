import { describe, expect, test } from "bun:test";
import isHashedAssetPath from "./is-hashed-asset-path";

describe("isHashedAssetPath", () => {
    test("matches content-named page scripts and styles", () => {
        expect(isHashedAssetPath({ pathname: "/.bunext/public/pages/chunk-AEHOZS24.js" })).toBe(true);
        expect(isHashedAssetPath({ pathname: "/.bunext/public/pages/auth/login/S2GYKY3T.js" })).toBe(true);
        expect(isHashedAssetPath({ pathname: "/.bunext/public/pages/auth/login/X4TQCLSA.css" })).toBe(true);
        expect(
            isHashedAssetPath({ pathname: "/.bunext/public/pages/admin/bots/%5Bbot_id%5D/VXCMP4GM.js" }),
        ).toBe(true);
    });

    test("leaves fixed names and everything else", () => {
        expect(isHashedAssetPath({ pathname: "/.bunext/public/vendor/react.js" })).toBe(false);
        expect(isHashedAssetPath({ pathname: "/.bunext/public/pages/index.js" })).toBe(false);
        expect(isHashedAssetPath({ pathname: "/admin/bots" })).toBe(false);
        expect(isHashedAssetPath({ pathname: "/public/AEHOZS24.js" })).toBe(false);
    });
});
