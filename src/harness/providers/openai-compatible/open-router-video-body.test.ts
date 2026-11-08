import { describe, expect, test } from "bun:test";
import openRouterVideoBody from "./open-router-video-body";

describe("openRouterVideoBody", () => {
    test("sends only what's set", () => {
        expect(openRouterVideoBody({ model: "google/veo-3.1", prompt: "A cat" })).toEqual({
            model: "google/veo-3.1",
            prompt: "A cat",
        });
        expect(
            openRouterVideoBody({
                model: "m",
                prompt: "p",
                duration: 8,
                resolution: "720p",
                aspect_ratio: "16:9",
                audio: false,
            }),
        ).toEqual({ model: "m", prompt: "p", duration: 8, resolution: "720p", aspect_ratio: "16:9", generate_audio: false });
    });

    test("frames go in frame_images, and leave references out", () => {
        const body = openRouterVideoBody({
            model: "m",
            prompt: "p",
            images: [
                { url: "data:a", role: "first_frame" },
                { url: "data:b", role: "reference" },
                { url: "data:c", role: "last_frame" },
            ],
        });

        expect(body.frame_images).toEqual([
            { type: "image_url", image_url: { url: "data:a" }, frame_type: "first_frame" },
            { type: "image_url", image_url: { url: "data:c" }, frame_type: "last_frame" },
        ]);
        expect(body.input_references).toBeUndefined();
    });

    test("references alone go in input_references", () => {
        const body = openRouterVideoBody({
            model: "m",
            prompt: "p",
            images: [{ url: "data:b", role: "reference" }],
        });

        expect(body.frame_images).toBeUndefined();
        expect(body.input_references).toEqual([{ type: "image_url", image_url: { url: "data:b" } }]);
    });

    test("a video to change goes in input_references with every image", () => {
        const body = openRouterVideoBody({
            model: "m",
            prompt: "p",
            images: [{ url: "data:a", role: "first_frame" }],
            videos: ["data:video/mp4;base64,AA"],
        });

        expect(body.frame_images).toBeUndefined();
        expect(body.input_references).toEqual([
            { type: "image_url", image_url: { url: "data:a" } },
            { type: "video_url", video_url: { url: "data:video/mp4;base64,AA" } },
        ]);
    });
});
