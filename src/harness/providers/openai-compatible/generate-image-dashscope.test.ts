import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { HarnessCandidate } from "../../types";

/**
 * Alibaba's DashScope/Model Studio hosts take reference images as the
 * `image` extension field on the generations call, never as a multipart
 * `/images/edits` upload, and only ever answer with URLs. A custom provider
 * pointed anywhere else keeps the standard multipart behaviour.
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

const base: HarnessCandidate = {
    key: "2:qwen-image-3.0-pro",
    provider: { kind: "custom", base_url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", name: "DashScope" },
    model: { slug: "qwen-image-3.0-pro", input_modalities: ["text", "image"], output_modalities: ["image"], supports_tools: false },
    source: "pinned",
};
const maas: HarnessCandidate = {
    ...base,
    provider: { ...base.provider, base_url: "https://ws.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1" },
};
const plain: HarnessCandidate = { ...base, provider: { ...base.provider, base_url: "https://api.example.com/v1" } };
const signal = new AbortController().signal;
const reference = `data:image/png;base64,${Buffer.from("ref-bytes").toString("base64")}`;

beforeEach(() => {
    payload = { data: [{ b64_json: Buffer.from("img").toString("base64") }] };
    captured = null;
    fetchImpl = async () => {
        throw new Error("fetch was not stubbed for this test");
    };
    globalThis.fetch = ((url: any, init?: any) => fetchImpl(url, init)) as typeof fetch;
});

describe("generateImage on DashScope/Model Studio hosts", () => {
    test("text-to-image posts the generations path with no image field", async () => {
        await generateImage({ candidate: base, prompt: "a cat", signal });

        expect(captured.json.image).toBeUndefined();
        expect(captured.form).toBeUndefined();
        expect(captured.json.model).toBe("qwen-image-3.0-pro");
    });

    test("references go in the image extension field, not a multipart edit", async () => {
        await generateImage({ candidate: base, prompt: "edit it", references: [reference], signal });

        expect(captured.form).toBeUndefined();
        expect(captured.json.image).toEqual([reference]);
    });

    test("several references keep their order in the image array", async () => {
        const second = `data:image/png;base64,${Buffer.from("second").toString("base64")}`;
        await generateImage({ candidate: base, prompt: "edit it", references: [reference, second], signal });

        expect(captured.json.image).toEqual([reference, second]);
    });

    test("a workspace maas host is treated the same way", async () => {
        await generateImage({ candidate: maas, prompt: "edit it", references: [reference], signal });

        expect(captured.form).toBeUndefined();
        expect(captured.json.image).toEqual([reference]);
    });

    test("a URL answer is downloaded (DashScope ignores b64_json)", async () => {
        payload = { data: [{ url: "https://cdn.example.com/out.png" }] };
        fetchImpl = async () => new Response(new Uint8Array([7, 8, 9]), { status: 200, headers: { "content-type": "image/png" } });

        const result = await generateImage({ candidate: base, prompt: "a cat", signal });

        expect(result.images[0]?.data).toEqual(new Uint8Array([7, 8, 9]));
    });

    test("a non-DashScope custom host still uploads references as multipart", async () => {
        await generateImage({ candidate: plain, prompt: "edit it", references: [reference], signal });

        expect(captured.form).toBeInstanceOf(FormData);
        expect(captured.json).toBeUndefined();
    });
});
