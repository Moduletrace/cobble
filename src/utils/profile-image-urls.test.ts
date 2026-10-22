import { describe, expect, test } from "bun:test";
import profileImageUrls from "./profile-image-urls";

describe("profileImageUrls", () => {
    test("serves a picture privately, with a thumbnail", () => {
        expect(profileImageUrls({ media_id: 7 })).toEqual({
            src: "/media/7",
            thumbnail_src: "/media/7/thumbnail",
        });
    });

    test("is empty without a picture", () => {
        expect(profileImageUrls({ media_id: null })).toEqual({});
        expect(profileImageUrls({})).toEqual({});
    });
});
