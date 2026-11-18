import { describe, expect, test } from "bun:test";
import hostDirectoryPath from "./host-directory-path";

describe("hostDirectoryPath", () => {
    test("keeps a plain absolute path", () => {
        expect(hostDirectoryPath({ source: "/srv/projects" })).toBe("/srv/projects");
    });

    test("trims and takes off a trailing slash", () => {
        expect(hostDirectoryPath({ source: "  /srv/projects/  " })).toBe("/srv/projects");
        expect(hostDirectoryPath({ source: "/srv//projects/./docs" })).toBe("/srv/projects/docs");
    });

    test("refuses an empty path", () => {
        expect(() => hostDirectoryPath({ source: "   " })).toThrow("needs a path on the host machine");
    });

    test("refuses a relative path", () => {
        expect(() => hostDirectoryPath({ source: "srv/projects" })).toThrow("must be absolute");
    });

    test("refuses climbing up", () => {
        expect(() => hostDirectoryPath({ source: "/srv/../etc" })).toThrow("can't climb up");
    });

    test("refuses the whole host", () => {
        expect(() => hostDirectoryPath({ source: "/" })).toThrow("The whole host machine can't be mounted");
        expect(() => hostDirectoryPath({ source: "//" })).toThrow("The whole host machine can't be mounted");
    });

    test("refuses the host's own system", () => {
        expect(() => hostDirectoryPath({ source: "/proc/self" })).toThrow("part of the host's own system");
        expect(() => hostDirectoryPath({ source: "/var/lib/docker/volumes" })).toThrow("part of the host's own system");
        expect(() => hostDirectoryPath({ source: "/dev" })).toThrow("part of the host's own system");
    });

    test("refuses what an install reserves", () => {
        expect(() => hostDirectoryPath({ source: "/data/bots", reserved: ["/data"] })).toThrow("part of the host's own system");
        expect(hostDirectoryPath({ source: "/srv/data", reserved: ["/data"] })).toBe("/srv/data");
    });

    test("refuses a path with a line break or null", () => {
        expect(() => hostDirectoryPath({ source: "/srv/a\nb" })).toThrow("line break");
        expect(() => hostDirectoryPath({ source: "/srv/a\0b" })).toThrow("null character");
    });
});