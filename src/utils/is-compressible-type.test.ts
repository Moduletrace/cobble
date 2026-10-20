import { describe, expect, test } from "bun:test";
import isCompressibleType from "./is-compressible-type";

describe("isCompressibleType", () => {
    test("takes text, scripts, JSON and SVG", () => {
        expect(isCompressibleType({ content_type: "text/html; charset=utf-8" })).toBe(true);
        expect(isCompressibleType({ content_type: "text/javascript;charset=utf-8" })).toBe(true);
        expect(isCompressibleType({ content_type: "text/css" })).toBe(true);
        expect(isCompressibleType({ content_type: "application/json" })).toBe(true);
        expect(isCompressibleType({ content_type: "application/javascript" })).toBe(true);
        expect(isCompressibleType({ content_type: "application/manifest+json" })).toBe(true);
        expect(isCompressibleType({ content_type: "image/svg+xml" })).toBe(true);
    });

    test("leaves media, binaries and streams", () => {
        expect(isCompressibleType({ content_type: "text/event-stream" })).toBe(false);
        expect(isCompressibleType({ content_type: "audio/mpeg" })).toBe(false);
        expect(isCompressibleType({ content_type: "image/png" })).toBe(false);
        expect(isCompressibleType({ content_type: "application/octet-stream" })).toBe(false);
        expect(isCompressibleType({ content_type: "font/woff2" })).toBe(false);
        expect(isCompressibleType({ content_type: null })).toBe(false);
    });
});
