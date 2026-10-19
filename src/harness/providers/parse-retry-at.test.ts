import { describe, expect, test } from "bun:test";
import parseRetryAt from "./parse-retry-at";

const now = 1_800_000_000_000;
const at = (headers: Record<string, string>) =>
    parseRetryAt({ headers: new Headers(headers), now });

describe("parseRetryAt", () => {
    test("reads Retry-After seconds and dates", () => {
        expect(at({ "retry-after": "30" })).toBe(now + 30_000);
        expect(at({ "retry-after": "Wed, 21 Oct 2026 07:28:00 GMT" })).toBe(
            Date.parse("Wed, 21 Oct 2026 07:28:00 GMT"),
        );
    });

    test("reads reset epochs in ms or seconds", () => {
        expect(at({ "x-ratelimit-reset": String(now + 5000) })).toBe(
            now + 5000,
        );
        expect(at({ "x-ratelimit-reset": "1800000060" })).toBe(
            1_800_000_060_000,
        );
    });

    test("reads reset durations", () => {
        expect(at({ "x-ratelimit-reset-requests": "6m0s" })).toBe(
            now + 360_000,
        );
        expect(at({ "x-ratelimit-reset": "1.5s" })).toBe(now + 1500);
        expect(at({ "x-ratelimit-reset": "20ms" })).toBe(now + 20);
    });

    test("is undefined without usable headers", () => {
        expect(at({})).toBe(undefined);
        expect(at({ "retry-after": "soon" })).toBe(undefined);
    });
});
