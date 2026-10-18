import { describe, expect, test } from "bun:test";
import parseLoginMethod from "./parse-login-method";

describe("parseLoginMethod", () => {
    test("reads password", () => {
        expect(parseLoginMethod({ value: "password" })).toBe("password");
        expect(parseLoginMethod({ value: " Password " })).toBe("password");
    });

    test("reads code", () => {
        expect(parseLoginMethod({ value: "code" })).toBe("code");
    });

    test("falls back to code when unset or unknown", () => {
        expect(parseLoginMethod({})).toBe("code");
        expect(parseLoginMethod({ value: "" })).toBe("code");
        expect(parseLoginMethod({ value: "passwrd" })).toBe("code");
    });
});
