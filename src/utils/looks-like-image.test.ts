import { describe, expect, test } from "bun:test";
import looksLikeImage from "./looks-like-image";

const bytes = (...values: number[]) => new Uint8Array(values);

/**
 * A real PNG, JPEG, GIF, WEBP and BMP pass; text does not. The check exists
 * because a truncated base64 string saved under `.png` was attached as a
 * 1376x768 image and the user got a file that would not open.
 */
describe("reading image bytes", () => {
    test("a PNG", () => {
        expect(looksLikeImage({ bytes: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) })).toBe(true);
    });

    test("a JPEG", () => {
        expect(looksLikeImage({ bytes: bytes(0xff, 0xd8, 0xff, 0xe0) })).toBe(true);
    });

    test("a GIF", () => {
        expect(looksLikeImage({ bytes: bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61) })).toBe(true);
    });

    test("a WEBP", () => {
        expect(
            looksLikeImage({
                bytes: bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50),
            }),
        ).toBe(true);
    });

    test("a BMP", () => {
        expect(looksLikeImage({ bytes: bytes(0x42, 0x4d, 0, 0) })).toBe(true);
    });

    test("a RIFF that isn't WEBP is not an image", () => {
        expect(
            looksLikeImage({
                bytes: bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45),
            }),
        ).toBe(false);
    });

    test("base64 text is not an image", () => {
        expect(looksLikeImage({ bytes: new TextEncoder().encode("iVBORw0KGgo=") })).toBe(false);
    });

    test("nothing at all is not an image", () => {
        expect(looksLikeImage({ bytes: new Uint8Array() })).toBe(false);
    });
});