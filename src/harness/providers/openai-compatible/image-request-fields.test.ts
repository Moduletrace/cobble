import { describe, expect, test } from "bun:test";
import imageRequestFields from "./image-request-fields";

describe("imageRequestFields", () => {
    test("keeps a pixel size for providers that take one", () => {
        expect(imageRequestFields({ provider_kind: "openai", size: "1024x1024" })).toEqual({
            size: "1024x1024",
        });
        expect(imageRequestFields({ provider_kind: "custom", size: "1024x1024" })).toEqual({
            size: "1024x1024",
        });
    });

    test("maps xAI's size onto an aspect ratio and never sends size", () => {
        expect(imageRequestFields({ provider_kind: "xai", size: "1024x1024" })).toEqual({
            aspect_ratio: "1:1",
        });
        expect(imageRequestFields({ provider_kind: "xai", size: "1920x1080" })).toEqual({
            aspect_ratio: "16:9",
        });
        expect(imageRequestFields({ provider_kind: "xai", size: "1080x1920" })).toEqual({
            aspect_ratio: "9:16",
        });
    });

    test("leaves a size xAI has no ratio for out of the call", () => {
        expect(imageRequestFields({ provider_kind: "xai", size: "123x456" })).toEqual({});
        expect(imageRequestFields({ provider_kind: "xai" })).toEqual({});
    });
});
