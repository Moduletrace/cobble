import { describe, expect, test } from "bun:test";
import isTimeZone from "./is-time-zone";

describe("isTimeZone", () => {
    test("knows IANA zones", () => {
        for (const zone of ["UTC", "Africa/Lagos", "America/Argentina/Buenos_Aires", "Etc/GMT+1"]) {
            expect(isTimeZone({ zone })).toBe(true);
        }
    });

    test("refuses anything else", () => {
        for (const zone of ["", "Mars/Olympus", "UTC; rm -rf /", "../etc"]) {
            expect(isTimeZone({ zone })).toBe(false);
        }
    });
});
