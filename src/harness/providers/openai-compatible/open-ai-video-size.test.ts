import { describe, expect, test } from "bun:test";
import openAiVideoSize from "./open-ai-video-size";

describe("openAiVideoSize", () => {
    test("landscape and portrait, larger from 1080p up", () => {
        expect(openAiVideoSize({ aspect_ratio: "16:9" })).toBe("1280x720");
        expect(openAiVideoSize({ aspect_ratio: "9:16", resolution: "720p" })).toBe("720x1280");
        expect(openAiVideoSize({ aspect_ratio: "16:9", resolution: "1080p" })).toBe("1792x1024");
        expect(openAiVideoSize({ aspect_ratio: "9:16", resolution: "4K" })).toBe("1024x1792");
    });

    test("anything else leaves the model's default", () => {
        expect(openAiVideoSize({})).toBeUndefined();
        expect(openAiVideoSize({ aspect_ratio: "1:1" })).toBeUndefined();
    });
});
