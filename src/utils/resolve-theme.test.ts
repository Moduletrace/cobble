import { describe, expect, test } from "bun:test";
import resolveTheme from "./resolve-theme";

describe("resolveTheme", () => {
    test("an explicit choice wins over the device", () => {
        expect(resolveTheme({ preference: "light", system_is_dark: true })).toBe(
            "light",
        );
        expect(resolveTheme({ preference: "dark", system_is_dark: false })).toBe(
            "dark",
        );
    });

    test("system follows the device", () => {
        expect(resolveTheme({ preference: "system", system_is_dark: true })).toBe(
            "dark",
        );
        expect(
            resolveTheme({ preference: "system", system_is_dark: false }),
        ).toBe("light");
    });
});
