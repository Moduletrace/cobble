import { describe, expect, test } from "bun:test";
import versionLabel from "./version-label";

describe("versionLabel", () => {
    test("a release names its version and that it is alpha", () => {
        expect(
            versionLabel({
                running: { version: "v0.1.5", mode: "production" },
            }),
        ).toBe("Cobble v0.1.5 (alpha)");
    });

    test("a development server says so beside the stage", () => {
        expect(
            versionLabel({
                running: { version: "0.1.5", mode: "development" },
            }),
        ).toBe("Cobble 0.1.5 (development, alpha)");
    });

    test("a server with no usable version still names the stage", () => {
        expect(
            versionLabel({ running: { version: null, mode: "production" } }),
        ).toBe("Cobble (alpha)");
    });

    test("no running version says nothing at all", () => {
        expect(versionLabel({ running: null })).toBeNull();
    });
});
