import { describe, expect, test } from "bun:test";
import runningVersion from "./running-version";

describe("runningVersion", () => {
    test("a release reports the build's version", () => {
        expect(
            runningVersion({
                env: { NODE_ENV: "production", COBBLE_VERSION: "v0.1.1" },
            }),
        ).toEqual({ version: "v0.1.1", mode: "production" });
    });

    test("a production build without a version falls back to the source's", () => {
        expect(
            runningVersion({
                env: { NODE_ENV: "production" },
                package_version: "0.1.1",
            }),
        ).toEqual({ version: "0.1.1", mode: "production" });
    });

    test("a development server reports the source's version too", () => {
        expect(
            runningVersion({
                env: { NODE_ENV: "development" },
                package_version: "0.1.1",
            }),
        ).toEqual({ version: "0.1.1", mode: "development" });
    });

    test("a development server with a build version prefers it", () => {
        expect(
            runningVersion({
                env: { NODE_ENV: "development", COBBLE_VERSION: "v0.2.0" },
                package_version: "0.1.1",
            }),
        ).toEqual({ version: "v0.2.0", mode: "development" });
    });

    test("no NODE_ENV at all is a development server", () => {
        expect(runningVersion({ env: {}, package_version: "0.1.1" })).toEqual({
            version: "0.1.1",
            mode: "development",
        });
    });

    test("an unusable version is dropped rather than shown", () => {
        expect(
            runningVersion({
                env: { NODE_ENV: "production", COBBLE_VERSION: "bad version!" },
                package_version: "",
            }),
        ).toEqual({ version: null, mode: "production" });
    });

    test("an empty build version falls back to the source's", () => {
        expect(
            runningVersion({
                env: { NODE_ENV: "production", COBBLE_VERSION: "  " },
                package_version: "0.1.1",
            }),
        ).toEqual({ version: "0.1.1", mode: "production" });
    });
});
