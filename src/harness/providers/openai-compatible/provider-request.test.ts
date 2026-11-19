import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { HarnessProviderConfig } from "../../types";
import HarnessError from "../../harness-error";

const provider = { kind: "custom", base_url: "https://api.example.com", name: "Example", api_key: "k" } as HarnessProviderConfig;

const realFetch = globalThis.fetch;
let fetchImpl: (url: string, init: RequestInit) => Promise<Response>;

beforeEach(() => {
    globalThis.fetch = ((url: string, init: RequestInit) => fetchImpl(url, init)) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

// Other files mock "./provider-request" to test its callers, and that mock
// stays in the import cache. A distinct specifier loads the real source for
// these tests, which exercise it directly.
const directSpecifier = "./provider-request?direct";
const { default: providerRequest } = (await import(directSpecifier)) as typeof import("./provider-request");

/** A response whose body streams chunks over time and aborts with its signal. */
function streamingResponse({ chunks, signal, step_ms = 30 }: { chunks: string[]; signal?: AbortSignal; step_ms?: number }) {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const body = new ReadableStream<Uint8Array>({
        start(ctrl) {
            chunks.forEach((chunk, i) => {
                timers.push(setTimeout(() => ctrl.enqueue(new TextEncoder().encode(chunk)), i * step_ms));
            });
            timers.push(setTimeout(() => ctrl.close(), chunks.length * step_ms));
            signal?.addEventListener("abort", () => {
                timers.forEach(clearTimeout);
                ctrl.error(new DOMException("The operation was aborted.", "AbortError"));
            });
        },
    });

    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
}

describe("providerRequest timeouts (M2)", () => {
    test("the body keeps streaming past the header timeout", async () => {
        fetchImpl = (_url, init) => Promise.resolve(streamingResponse({ chunks: ['{"a":', "1}"], signal: init.signal ?? undefined, step_ms: 40 }));

        const res = await providerRequest({ provider, path: "/x", timeout_ms: 20, body_timeout_ms: 5000 });

        expect(await res.json()).toEqual({ a: 1 });
    });

    test("a header that never arrives is a retryable timeout", async () => {
        fetchImpl = (_url, init) =>
            new Promise((_resolve, reject) => {
                init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
            });

        await expect(providerRequest({ provider, path: "/x", timeout_ms: 20 })).rejects.toMatchObject({
            message: expect.stringContaining("took too long"),
            retryable: true,
        });
    });

    test("a body that stalls is a HarnessError, not a raw abort", async () => {
        fetchImpl = (_url, init) => Promise.resolve(streamingResponse({ chunks: ['{"a":'], signal: init.signal ?? undefined, step_ms: 200 }));

        const res = await providerRequest({ provider, path: "/x", timeout_ms: 5000, body_timeout_ms: 20 });

        await expect(res.json()).rejects.toBeInstanceOf(HarnessError);
        await expect(
            providerRequest({ provider, path: "/x", timeout_ms: 5000, body_timeout_ms: 20 }).then((r: Response) => r.json()),
        ).rejects.toMatchObject({ retryable: true, message: expect.stringContaining("stopped sending") });
    });

    test("a caller cancellation is an aborted HarnessError", async () => {
        fetchImpl = (_url, init) =>
            new Promise((_resolve, reject) => {
                if (init.signal?.aborted) reject(new DOMException("aborted", "AbortError"));
                init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
            });

        const controller = new AbortController();
        controller.abort();

        await expect(providerRequest({ provider, path: "/x", signal: controller.signal })).rejects.toMatchObject({
            code: "aborted",
        });
    });

    test("a non-ok answer is classified by its status", async () => {
        fetchImpl = () => Promise.resolve(new Response("rate limited", { status: 429 }));

        await expect(providerRequest({ provider, path: "/x" })).rejects.toBeInstanceOf(HarnessError);
    });

    test("a failure says which request failed", async () => {
        fetchImpl = () => Promise.resolve(new Response("", { status: 404 }));

        await expect(providerRequest({ provider, path: "/images/generations" })).rejects.toMatchObject({
            message: expect.stringContaining("POST https://api.example.com/images/generations"),
        });
    });

    test("a base URL override goes to that address instead", async () => {
        const seen: string[] = [];

        fetchImpl = (url) => {
            seen.push(url);
            return Promise.resolve(new Response("{}", { status: 200 }));
        };

        await providerRequest({
            provider,
            base_url: "https://ws-1.ap-southeast-1.maas.aliyuncs.com",
            path: "/api/v1/services/aigc/multimodal-generation/generation",
        });

        expect(seen).toEqual([
            "https://ws-1.ap-southeast-1.maas.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
        ]);
    });
});
