import { describe, expect, test } from "bun:test";
import isAuthorized from "./is-authorized";

describe("isAuthorized", () => {
    test("lets everything in without a token", () => {
        expect(isAuthorized({ headers: {}, token: "" })).toBe(true);
    });

    test("needs the exact bearer token", () => {
        expect(isAuthorized({ headers: { authorization: "Bearer abc" }, token: "abc" })).toBe(true);
        expect(isAuthorized({ headers: { authorization: "Bearer abd" }, token: "abc" })).toBe(false);
        expect(isAuthorized({ headers: { authorization: "Bearer ab" }, token: "abc" })).toBe(false);
        expect(isAuthorized({ headers: {}, token: "abc" })).toBe(false);
    });
});
