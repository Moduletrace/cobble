import { describe, expect, test } from "bun:test";
import xAuthorityEntry from "./x-authority-entry";

describe("xAuthorityEntry", () => {
    test("writes a wildcard MIT-MAGIC-COOKIE-1 entry for the display", () => {
        const cookie = Buffer.alloc(16, 0xab);
        const entry = xAuthorityEntry({ display: ":99", cookie });
        const name = Buffer.from("MIT-MAGIC-COOKIE-1");

        expect(entry.readUInt16BE(0)).toBe(0xffff);
        expect(entry.readUInt16BE(2)).toBe(0);
        expect(entry.readUInt16BE(4)).toBe(2);
        expect(entry.subarray(6, 8).toString()).toBe("99");
        expect(entry.readUInt16BE(8)).toBe(name.length);
        expect(entry.subarray(10, 10 + name.length).toString()).toBe(name.toString());
        expect(entry.readUInt16BE(10 + name.length)).toBe(16);
        expect(entry.subarray(12 + name.length).equals(cookie)).toBe(true);
    });

    test("takes a screen number off and refuses what isn't a display", () => {
        expect(xAuthorityEntry({ display: "host:3.0", cookie: Buffer.alloc(16) }).subarray(6, 7).toString()).toBe("3");
        expect(() => xAuthorityEntry({ display: "nope", cookie: Buffer.alloc(16) })).toThrow();
        expect(() => xAuthorityEntry({ display: ":1", cookie: Buffer.alloc(8) })).toThrow();
    });
});
