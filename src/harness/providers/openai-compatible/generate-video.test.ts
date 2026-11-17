import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";

/**
 * The video adapter must fit one tool call and never buffer an unbounded
 * body (M9): the wait shares a deadline derived from the tool's timeout
 * minus room for the downloads, and each download is cut at
 * `VideoOutputMaxBytes`. The provider is stubbed; the deadline and cap are
 * shrunk on the shared `AppData` so the behaviour is observable without
 * waiting minutes or allocating hundreds of megabytes.
 */

let submit_json: unknown = { id: "v1", status: "completed" };
let poll_json: unknown = { id: "v1", status: "completed" };
let download_body: Uint8Array<ArrayBuffer> = new Uint8Array([1, 2, 3, 4]);

mock.module("./provider-request", () => ({
    default: async (params: { path: string; method?: string }) => {
        const path = String(params.path);
        if (path.includes("/content")) {
            return new Response(download_body, { headers: { "content-type": "video/mp4" } });
        }
        if (params.method == "GET") {
            return new Response(JSON.stringify(poll_json), { headers: { "content-type": "application/json" } });
        }
        return new Response(JSON.stringify(submit_json), { headers: { "content-type": "application/json" } });
    },
}));

mock.module("../grab-provider-preset", () => ({
    default: () => ({ title: "TestProvider", video_path: "/videos" }),
}));

const { default: generateVideo } = await import("./generate-video");

afterAll(() => mock.restore());

const candidate = {
    key: "c1",
    provider: { kind: "custom", base_url: "https://api.test", name: "TestProvider" },
    model: { slug: "vid", input_modalities: ["text"], output_modalities: ["video"], supports_tools: false },
    source: "pinned",
} as unknown as HarnessCandidate;

const signal = new AbortController().signal;

/** `AppData` is read-only; the test shrinks a few limits on the shared object. */
const settings = AppData as unknown as Record<string, number>;

const original = {
    VideoOutputMaxBytes: AppData.VideoOutputMaxBytes,
    HarnessToolTimeoutMs: AppData.HarnessToolTimeoutMs,
    VideoDownloadMarginMs: AppData.VideoDownloadMarginMs,
    VideoMaxWaitMs: AppData.VideoMaxWaitMs,
    VideoPollIntervalMs: AppData.VideoPollIntervalMs,
};

beforeEach(() => {
    submit_json = { id: "v1", status: "completed" };
    poll_json = { id: "v1", status: "completed" };
    download_body = new Uint8Array([1, 2, 3, 4]);
});

afterEach(() => {
    Object.assign(settings, original);
});

describe("generateVideo adapter (M9)", () => {
    test("downloads a finished video's bytes", async () => {
        const made = await generateVideo({ candidate, prompt: "a cat", signal });

        expect(made.videos.length).toBe(1);
        expect(made.videos[0]!.data.byteLength).toBe(4);
        expect(made.videos[0]!.media_type).toBe("video/mp4");
    });

    test("cuts a download past the byte cap instead of buffering it whole", async () => {
        settings.VideoOutputMaxBytes = 8;
        download_body = new Uint8Array(100);

        await expect(generateVideo({ candidate, prompt: "a cat", signal })).rejects.toThrow("larger than allowed");
    });

    test("the wait shares the tool's deadline, not the full VideoMaxWaitMs", async () => {
        settings.HarnessToolTimeoutMs = 60;
        settings.VideoDownloadMarginMs = 20;
        settings.VideoMaxWaitMs = 60_000;
        settings.VideoPollIntervalMs = 5;
        submit_json = { id: "v1", status: "in_progress" };
        poll_json = { id: "v1", status: "in_progress" };

        const started = Date.now();
        let error: unknown;
        try {
            await generateVideo({ candidate, prompt: "a cat", signal });
        } catch (caught) {
            error = caught;
        }

        expect(error).toBeInstanceOf(HarnessError);
        expect((error as HarnessError).message).toContain("wasn't ready");
        // Bounded by the tool timeout minus the margin (~40ms), not the
        // 60s VideoMaxWaitMs: the call returns long before that.
        expect(Date.now() - started).toBeLessThan(5_000);
    });
});
