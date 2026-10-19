import { describe, expect, test } from "bun:test";
import urlBase64ToUint8Array from "./url-base64-to-uint8-array";

describe("urlBase64ToUint8Array", () => {
    test("decodes base64url without padding", () => {
        expect([...urlBase64ToUint8Array("AQID")]).toEqual([1, 2, 3]);
    });

    test("handles the URL-safe characters and missing padding", () => {
        const bytes = urlBase64ToUint8Array("-_8");

        expect([...bytes]).toEqual([0xfb, 0xff]);
    });

    test("returns a fresh typed array", () => {
        const bytes = urlBase64ToUint8Array("AQID");

        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.byteLength).toBe(3);
    });
});
