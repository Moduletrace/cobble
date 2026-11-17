import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";

/**
 * What the provider's `/images` answers, and the body it was asked for.
 */
let payload: unknown = null;
let captured: any = null;

mock.module("./provider-request", () => ({
    default: async (params: any) => {
        captured = params;
        return { json: async () => payload };
    },
}));

const { default: generateImage } = await import("./generate-image");

const realFetch = globalThis.fetch;
let fetchImpl: (url: any, init?: any) => Promise<Response> = async () => {
    throw new Error("fetch was not stubbed for this test");
};

afterAll(() => {
    mock.restore();
    globalThis.fetch = realFetch;
});

const candidate: HarnessCandidate = {
    key: "1:image-model",
    provider: { kind: "custom", base_url: "https://api.example.com", name: "Test" },
    model: { slug: "image-model", input_modalities: ["text"], output_modalities: ["image"], supports_tools: false },
    source: "pinned",
};
const openrouter: HarnessCandidate = { ...candidate, provider: { ...candidate.provider, kind: "openrouter" } };
const signal = new AbortController().signal;

beforeEach(() => {
    payload = null;
    captured = null;
    fetchImpl = async () => {
        throw new Error("fetch was not stubbed for this test");
    };
    globalThis.fetch = ((url: any, init?: any) => fetchImpl(url, init)) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("generateImage guards provider URLs (H4)", () => {
    test("asks for b64_json on OpenRouter too, and decodes it without a download", async () => {
        payload = { data: [{ b64_json: Buffer.from("hello").toString("base64") }] };
        const result = await generateImage({ candidate: openrouter, prompt: "a cat", signal });
        expect(captured.json.response_format).toBe("b64_json");
        expect(result.images[0]?.data).toEqual(Uint8Array.from(Buffer.from("hello")));
    });

    test("a b64_json item is decoded inline, never fetched", async () => {
        payload = { data: [{ b64_json: Buffer.from("hi").toString("base64"), media_type: "image/jpeg" }] };
        const result = await generateImage({ candidate, prompt: "a cat", signal });
        expect(result.images[0]?.media_type).toBe("image/jpeg");
        expect(result.images[0]?.data).toEqual(Uint8Array.from(Buffer.from("hi")));
    });

    test("an http URL is refused", async () => {
        payload = { data: [{ url: "http://cdn.example.com/1.png" }] };
        await expect(generateImage({ candidate, prompt: "a cat", signal })).rejects.toThrow(/https/);
    });

    test("an internal address is refused", async () => {
        payload = { data: [{ url: "https://169.254.169.254/latest/meta-data/" }] };
        await expect(generateImage({ candidate, prompt: "a cat", signal })).rejects.toThrow(/internal/);
    });

    test("a malformed URL is a HarnessError, not an escaping TypeError", async () => {
        payload = { data: [{ url: "not a url" }] };
        await expect(generateImage({ candidate, prompt: "a cat", signal })).rejects.toBeInstanceOf(HarnessError);
    });

    test("a body past the byte cap is refused, not buffered whole", async () => {
        payload = { data: [{ url: "https://cdn.example.com/big.png" }] };
        const huge = new Uint8Array(AppData.HarnessImageDownloadMaxBytes + 1);
        fetchImpl = async () =>
            new Response(
                new ReadableStream({
                    start(controller) {
                        controller.enqueue(huge);
                        controller.close();
                    },
                }),
                { status: 200, headers: { "content-type": "image/png" } },
            );
        await expect(generateImage({ candidate, prompt: "a cat", signal })).rejects.toThrow(/larger than allowed/);
    });

    test("a public https URL is downloaded and returned", async () => {
        payload = { data: [{ url: "https://cdn.example.com/1.png" }] };
        fetchImpl = async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } });
        const result = await generateImage({ candidate, prompt: "a cat", signal });
        expect(result.images[0]?.data).toEqual(new Uint8Array([1, 2, 3]));
        expect(result.images[0]?.media_type).toBe("image/png");
    });

    test("a redirect to an internal address is refused at the hop", async () => {
        payload = { data: [{ url: "https://cdn.example.com/1.png" }] };
        fetchImpl = async () => new Response(null, { status: 302, headers: { location: "https://127.0.0.1/secret" } });
        await expect(generateImage({ candidate, prompt: "a cat", signal })).rejects.toThrow(/internal/);
    });
});
