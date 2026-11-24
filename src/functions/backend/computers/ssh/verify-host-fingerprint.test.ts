import { describe, expect, it } from "bun:test";
import verifyHostFingerprint from "./verify-host-fingerprint";

describe("verifyHostFingerprint", () => {
    it("accepts when expected is unset (trust on first use)", () => {
        expect(verifyHostFingerprint({ expected: null, hex: "abcdef1234" })).toBe(true);
        expect(verifyHostFingerprint({ expected: undefined, hex: "abcdef1234" })).toBe(true);
        expect(verifyHostFingerprint({ expected: "", hex: "abcdef1234" })).toBe(true);
    });

    it("accepts when fingerprints match (case-insensitive and prefix-tolerant)", () => {
        expect(verifyHostFingerprint({ expected: "abcdef1234", hex: "abcdef1234" })).toBe(true);
        expect(verifyHostFingerprint({ expected: "ABCDEF1234", hex: "abcdef1234" })).toBe(true);
        expect(verifyHostFingerprint({ expected: "SHA256:abcdef1234", hex: "abcdef1234" })).toBe(true);
        expect(verifyHostFingerprint({ expected: "abcdef1234", hex: "SHA256:ABCDEF1234" })).toBe(true);
    });

    it("rejects when fingerprints differ", () => {
        expect(verifyHostFingerprint({ expected: "abcdef1234", hex: "1234567890" })).toBe(false);
    });
});
