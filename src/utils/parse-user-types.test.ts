import { describe, expect, test } from "bun:test";
import parseUserTypes from "./parse-user-types";

describe("parseUserTypes", () => {
    test("splits the joined types, in dict order", () => {
        expect(parseUserTypes({ user_types: "read_only, admin" })).toEqual(["admin", "read_only"]);
    });

    test("drops unknown types and handles none", () => {
        expect(parseUserTypes({ user_types: "auditor,admin" })).toEqual(["admin"]);
        expect(parseUserTypes({ user_types: null })).toEqual([]);
    });
});
