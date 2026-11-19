import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";

/**
 * Alibaba's DashScope/Model Studio hosts take reference images as the
 * `image` extension field on the generations call, never as a multipart
 * `/images/edits` upload, and only ever answer with URLs. A custom provider
 * pointed anywhere else keeps the standard multipart behaviour. A host with no
 * compatible images route (the Token Plan host answers 404) falls back to the
 * native call on the host root.
 */
let payload: unknown = null;
let captured: any = null;
let calls: any[] = [];
let respond: ((params: any) => Promise<any>) | null = null;

mock.module("./provider-request", () => ({
    default: async (params: any) => {
        captured = params;
        calls.push(params);
        if (respond) return await respond(params);
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
    calls = [];
    respond = null;
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

/**
 * The Token Plan host serves chat and the native API, never
 * `/compatible-mode/v1/images/generations`, so the pick that worked on the
 * workspace host 404s there and the picture has to come from the native call.
 */
describe("generateImage when the compatible images route is missing", () => {
    const native = (overrides: any = {}) => ({
        output: {
            choices: [{ message: { content: [{ image: "https://cdn.example.com/native.png" }, ...(overrides.extra ?? [])] } }],
        },
        ...overrides.output,
    });

    test("a 404 falls back to the native call on the host root", async () => {
        respond = async (params) => {
            if (params.path.endsWith("/images/generations")) {
                throw new HarnessError({ message: "Alibaba Cloud Token Plan: HTTP 404", status: 404 });
            }

            return { json: async () => native() };
        };
        fetchImpl = async () => new Response(new Uint8Array([1, 2]), { status: 200, headers: { "content-type": "image/png" } });

        const result = await generateImage({ candidate: base, prompt: "a cat", size: "1024x1024", n: 1, signal });

        expect(calls[0].path).toBe("/images/generations");
        expect(calls[1].path).toBe("/api/v1/services/aigc/multimodal-generation/generation");
        expect(calls[1].base_url).toBe("https://dashscope-intl.aliyuncs.com");
        expect(calls[1].json.model).toBe("qwen-image-3.0-pro");
        expect(calls[1].json.input.messages[0].content[0]).toEqual({ text: "a cat" });
        expect(calls[1].json.parameters.size).toBe("1024*1024");
        expect(calls[1].json.parameters.n).toBe(1);
        expect(result.images[0]?.data).toEqual(new Uint8Array([1, 2]));
        expect(result.images[0]?.media_type).toBe("image/png");
    });

    test("references go as image parts beside the prompt", async () => {
        respond = async (params) => {
            if (params.path.endsWith("/images/generations")) {
                throw new HarnessError({ message: "HTTP 404", status: 404 });
            }

            return { json: async () => native() };
        };
        fetchImpl = async () => new Response(new Uint8Array([3]), { status: 200, headers: { "content-type": "image/png" } });

        await generateImage({ candidate: base, prompt: "edit it", references: [reference], signal });

        expect(calls[0].json.image).toEqual([reference]);
        expect(calls[1].json.input.messages[0].content).toEqual([{ text: "edit it" }, { image: reference }]);
    });

    test("a 405 is the same missing route", async () => {
        respond = async (params) => {
            if (params.path.endsWith("/images/generations")) {
                throw new HarnessError({ message: "HTTP 405", status: 405 });
            }

            return { json: async () => native() };
        };
        fetchImpl = async () => new Response(new Uint8Array([4]), { status: 200, headers: { "content-type": "image/png" } });

        const result = await generateImage({ candidate: maas, prompt: "a cat", signal });

        expect(calls[1].path).toBe("/api/v1/services/aigc/multimodal-generation/generation");
        expect(result.images.length).toBe(1);
    });

    test("a key or credits failure does not fall back", async () => {
        respond = async () => {
            throw new HarnessError({ message: "DashScope: InvalidApiKey", status: 401, provider_wide: true });
        };

        await expect(generateImage({ candidate: base, prompt: "a cat", signal })).rejects.toMatchObject({
            message: "DashScope: InvalidApiKey",
        });
        expect(calls.length).toBe(1);
    });

    test("a non-DashScope host with a 404 still fails plainly", async () => {
        respond = async () => {
            throw new HarnessError({ message: "Example: HTTP 404", status: 404 });
        };

        await expect(generateImage({ candidate: plain, prompt: "a cat", signal })).rejects.toMatchObject({
            status: 404,
        });
        expect(calls.length).toBe(1);
    });

    test("the native answer's results list is read too", async () => {
        respond = async (params) => {
            if (params.path.endsWith("/images/generations")) {
                throw new HarnessError({ message: "HTTP 404", status: 404 });
            }

            return { json: async () => ({ output: { results: [{ url: "https://cdn.example.com/result.png" }] } }) };
        };
        fetchImpl = async () => new Response(new Uint8Array([5]), { status: 200, headers: { "content-type": "image/png" } });

        const result = await generateImage({ candidate: base, prompt: "a cat", signal });

        expect(result.images.length).toBe(1);
    });

    test("a native answer with no image is a retryable failure", async () => {
        respond = async (params) => {
            if (params.path.endsWith("/images/generations")) {
                throw new HarnessError({ message: "HTTP 404", status: 404 });
            }

            return { json: async () => ({ output: { choices: [] } }) };
        };

        await expect(generateImage({ candidate: base, prompt: "a cat", signal })).rejects.toMatchObject({
            retryable: true,
            message: expect.stringContaining("no image came back"),
        });
    });
});
