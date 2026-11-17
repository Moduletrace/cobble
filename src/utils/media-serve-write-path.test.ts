import { describe, expect, test } from "bun:test";
import mediaServeWritePath from "./media-serve-write-path";

describe("mediaServeWritePath", () => {
    test("serves the original for a plain request", () => {
        expect(
            mediaServeWritePath({
                media: { media_write_path: "bots/1/a.png", media_thumbnail_write_path: "bots/1/a.thumb.png" },
            }),
        ).toBe("bots/1/a.png");
    });

    test("serves the smaller copy for a thumbnail request when one exists", () => {
        expect(
            mediaServeWritePath({
                media: { media_write_path: "bots/1/a.png", media_thumbnail_write_path: "bots/1/a.thumb.png" },
                thumbnail: true,
            }),
        ).toBe("bots/1/a.thumb.png");
    });

    test("falls back to the original when no smaller copy was made", () => {
        expect(
            mediaServeWritePath({
                media: { media_write_path: "bots/1/a.png", media_thumbnail_write_path: null },
                thumbnail: true,
            }),
        ).toBe("bots/1/a.png");

        expect(
            mediaServeWritePath({ media: { media_write_path: "bots/1/a.png" }, thumbnail: true }),
        ).toBe("bots/1/a.png");
    });

    test("stays empty when the row points nowhere", () => {
        expect(mediaServeWritePath({ media: {}, thumbnail: true })).toBeUndefined();
        expect(mediaServeWritePath({ media: {} })).toBeUndefined();
    });
});
