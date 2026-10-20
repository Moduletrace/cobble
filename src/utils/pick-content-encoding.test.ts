import { describe, expect, test } from "bun:test";
import pickContentEncoding from "./pick-content-encoding";

describe("pickContentEncoding", () => {
    test("prefers brotli", () => {
        expect(pickContentEncoding({ accept_encoding: "gzip, deflate, br, zstd" })).toBe("br");
    });

    test("falls back to gzip", () => {
        expect(pickContentEncoding({ accept_encoding: "gzip, deflate" })).toBe("gzip");
        expect(pickContentEncoding({ accept_encoding: "*", offer: ["gzip"] })).toBe("gzip");
    });

    test("only offers what the caller can produce", () => {
        expect(pickContentEncoding({ accept_encoding: "br, gzip", offer: ["gzip"] })).toBe("gzip");
        expect(pickContentEncoding({ accept_encoding: "br", offer: ["gzip"] })).toBe(null);
    });

    test("is none without a supported coding", () => {
        expect(pickContentEncoding({ accept_encoding: "identity" })).toBe(null);
        expect(pickContentEncoding({ accept_encoding: "" })).toBe(null);
        expect(pickContentEncoding({ accept_encoding: null })).toBe(null);
    });

    test("skips refused codings", () => {
        expect(pickContentEncoding({ accept_encoding: "br;q=0, gzip;q=0.8" })).toBe("gzip");
        expect(pickContentEncoding({ accept_encoding: "br;q=0.0, gzip;q=0" })).toBe(null);
    });
});
