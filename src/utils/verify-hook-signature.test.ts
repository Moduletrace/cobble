import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";
import verifyHookSignature from "./verify-hook-signature";

const secret = "s3cret";
const body = `{"action":"opened"}`;
const digest = createHmac("sha256", secret).update(body).digest();

describe("verifyHookSignature", () => {
    test("accepts each format signed with the secret", () => {
        expect(verifyHookSignature({ body, secret, format: "hex", signature: digest.toString("hex") })).toBe(true);
        expect(
            verifyHookSignature({ body, secret, format: "sha256=hex", signature: `sha256=${digest.toString("hex")}` }),
        ).toBe(true);
        expect(verifyHookSignature({ body, secret, format: "base64", signature: digest.toString("base64") })).toBe(
            true,
        );
    });

    test("refuses a wrong secret or a changed body", () => {
        const other = createHmac("sha256", "other").update(body).digest("hex");

        expect(verifyHookSignature({ body, secret, format: "hex", signature: other })).toBe(false);
        expect(
            verifyHookSignature({ body: `${body} `, secret, format: "hex", signature: digest.toString("hex") }),
        ).toBe(false);
    });

    test("refuses a missing, cut or malformed signature", () => {
        expect(verifyHookSignature({ body, secret, format: "hex", signature: null })).toBe(false);
        expect(verifyHookSignature({ body, secret, format: "hex", signature: digest.toString("hex").slice(2) })).toBe(
            false,
        );
        expect(verifyHookSignature({ body, secret, format: "hex", signature: "zz" })).toBe(false);
        expect(verifyHookSignature({ body, secret, format: "sha256=hex", signature: "sha256=" })).toBe(false);
    });
});
