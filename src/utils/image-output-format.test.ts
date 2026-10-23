import { describe, expect, test } from "bun:test";
import imageOutputFormat from "./image-output-format";

describe("imageOutputFormat", () => {
    test("keeps a PNG a PNG, so its transparency survives", () => {
        expect(imageOutputFormat({ ext: "png" })).toEqual({
            format: "png",
            ext: "png",
            mime_type: "image/png",
        });
        expect(imageOutputFormat({ ext: "logo.PNG" }).format).toBe("png");
    });

    test("keeps WebP a WebP", () => {
        expect(imageOutputFormat({ ext: "webp" })).toEqual({
            format: "webp",
            ext: "webp",
            mime_type: "image/webp",
        });
    });

    test("stores a GIF as a PNG, which keeps transparency", () => {
        expect(imageOutputFormat({ ext: "gif" })).toEqual({
            format: "png",
            ext: "png",
            mime_type: "image/png",
        });
    });

    test("stores anything else as JPEG, as it always has", () => {
        for (const ext of ["jpeg", "jpg", "bmp", "tiff", "", null, undefined, "weird"]) {
            expect(imageOutputFormat({ ext })).toEqual({
                format: "jpeg",
                ext: "jpeg",
                mime_type: "image/jpeg",
            });
        }
    });

    test("reads the extension out of a name", () => {
        expect(imageOutputFormat({ ext: "summit-logo.png" }).format).toBe("png");
        expect(imageOutputFormat({ ext: "media/2/thing.webp" }).format).toBe("webp");
    });
});
