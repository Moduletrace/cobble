import { describe, expect, test } from "bun:test";
import readVideoJob from "./read-video-job";

describe("readVideoJob", () => {
    test("reads OpenRouter's job as it starts, works and finishes", () => {
        expect(readVideoJob({ json: { id: "gen-vid-1", polling_url: "/x", status: "pending" } })).toEqual({
            id: "gen-vid-1",
            state: "working",
            outputs: 0,
            cost: undefined,
        });
        expect(
            readVideoJob({
                json: {
                    id: "gen-vid-1",
                    status: "completed",
                    unsigned_urls: ["a", "b"],
                    usage: { cost: 0.4, is_byok: false },
                },
            }),
        ).toEqual({ id: "gen-vid-1", state: "done", outputs: 2, cost: 0.4 });
    });

    test("reads OpenAI's job, which always makes one video", () => {
        expect(readVideoJob({ json: { id: "video_1", status: "queued" } })?.state).toBe("working");
        expect(readVideoJob({ json: { id: "video_1", status: "completed" } })).toMatchObject({
            state: "done",
            outputs: 1,
        });
    });

    test("says why a job ended without a video", () => {
        expect(
            readVideoJob({ json: { id: "1", status: "failed", error: { message: "Moderation blocked it" } } }),
        ).toMatchObject({ state: "failed", error: "Moderation blocked it" });
        expect(readVideoJob({ json: { id: "1", status: "failed", error: "Bad prompt" } })?.error).toBe(
            "Bad prompt",
        );
        expect(readVideoJob({ json: { id: "1", status: "expired" } })).toMatchObject({ state: "failed" });
        expect(readVideoJob({ json: { id: "1", status: "cancelled" } })).toMatchObject({ state: "failed" });
    });

    test("no job id, no job", () => {
        expect(readVideoJob({ json: { error: "nope" } })).toBeNull();
        expect(readVideoJob({ json: null })).toBeNull();
    });
});
