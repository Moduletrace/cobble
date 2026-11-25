import { describe, expect, test } from "bun:test";
import isStaleClientBuild from "./is-stale-client-build";

describe("isStaleClientBuild", () => {
    test("a page from another build is stale", () => {
        expect(isStaleClientBuild({ client_build: "build-a", server_build: "build-b" })).toBe(
            true,
        );
    });

    test("the running build is current", () => {
        expect(
            isStaleClientBuild({ client_build: "build-a", server_build: "build-a" }),
        ).toBe(false);
    });

    test("a development server or an old client is never refused", () => {
        expect(isStaleClientBuild({ client_build: null, server_build: "build-b" })).toBe(false);
        expect(isStaleClientBuild({ client_build: "build-a", server_build: null })).toBe(false);
        expect(isStaleClientBuild({})).toBe(false);
    });
});