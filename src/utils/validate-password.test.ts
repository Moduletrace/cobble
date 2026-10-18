import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import validatePassword from "./validate-password";

describe("validatePassword", () => {
    test("rejects an empty password", () => {
        expect(validatePassword({ password: "" })).toBeString();
        expect(validatePassword({})).toBeString();
    });

    test("rejects passwords shorter than the minimum", () => {
        const password = "a".repeat(AppData["PasswordMinLength"] - 1);
        expect(validatePassword({ password })).toContain("at least");
    });

    test("rejects passwords longer than the maximum", () => {
        const password = "a".repeat(AppData["PasswordMaxLength"] + 1);
        expect(validatePassword({ password })).toContain("longer than");
    });

    test("rejects whitespace-only passwords", () => {
        const password = " ".repeat(AppData["PasswordMinLength"]);
        expect(validatePassword({ password })).toContain("spaces");
    });

    test("accepts a password at the minimum length", () => {
        const password = "a".repeat(AppData["PasswordMinLength"]);
        expect(validatePassword({ password })).toBeUndefined();
    });
});
