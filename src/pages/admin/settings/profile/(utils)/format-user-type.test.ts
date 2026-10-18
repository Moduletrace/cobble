import { describe, expect, test } from "bun:test";
import formatUserType from "./format-user-type";

describe("formatUserType", () => {
    test("turns a user type value into a sentence-case label", () => {
        expect(formatUserType({ user_type: "super_admin" })).toBe("Super admin");
        expect(formatUserType({ user_type: "read_only" })).toBe("Read only");
        expect(formatUserType({ user_type: "admin" })).toBe("Admin");
    });
});
