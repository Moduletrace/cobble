import { describe, expect, test } from "bun:test";
import AppError from "./app-error";
import resolveWorkspacePicture from "./resolve-workspace-picture";

const image = (id: number) => ({ id, media_type: "image" });

describe("resolveWorkspacePicture", () => {
    test("leaves the picture alone when nothing is asked for", () => {
        expect(resolveWorkspacePicture({ current: 4 })).toBeUndefined();
    });

    test("sets a new image of the caller's", () => {
        expect(
            resolveWorkspacePicture({ requested: 9, current: 4, media: image(9) }),
        ).toBe(9);
    });

    test("clears the picture with null", () => {
        expect(
            resolveWorkspacePicture({ requested: null, current: 4 }),
        ).toBeNull();
    });

    test("naming the picture it already has changes nothing, so it is never deleted", () => {
        expect(
            resolveWorkspacePicture({ requested: 4, current: 4 }),
        ).toBeUndefined();
        expect(
            resolveWorkspacePicture({ requested: "4", current: 4, media: image(4) }),
        ).toBeUndefined();
    });

    test("refuses media that isn't the caller's", () => {
        expect(() =>
            resolveWorkspacePicture({ requested: 9, current: null, media: null }),
        ).toThrow(AppError);
    });

    test("refuses anything that isn't an image", () => {
        expect(() =>
            resolveWorkspacePicture({
                requested: 9,
                current: null,
                media: { id: 9, media_type: "document" },
            }),
        ).toThrow(`A workspace picture has to be an image.`);
    });

    test("refuses an id that names a different row than the one looked up", () => {
        expect(() =>
            resolveWorkspacePicture({
                requested: 9,
                current: null,
                media: image(10),
            }),
        ).toThrow(AppError);
    });

    test("refuses an id that isn't a positive integer", () => {
        for (const requested of [0, -3, 1.5, "abc"]) {
            expect(() =>
                resolveWorkspacePicture({ requested, current: null }),
            ).toThrow(AppError);
        }
    });
});
