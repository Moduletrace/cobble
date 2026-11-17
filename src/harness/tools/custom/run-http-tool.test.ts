import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { CustomToolHttpConfig } from "@/src/types";
import { AppData } from "@/src/data/app-data";
import runHttpTool from "./run-http-tool";

const config: CustomToolHttpConfig = { method: "GET", url: "https://api.example.com/x" };
const signal = new AbortController().signal;
const realFetch = globalThis.fetch;
let fetchImpl: (url: string, init: RequestInit) => Promise<Response>;

beforeEach(() => {
    globalThis.fetch = ((url: string, init: RequestInit) => fetchImpl(url, init)) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("runHttpTool bounds (M11)", () => {
    test("a JSON answer is pretty-printed", async () => {
        fetchImpl = () => Promise.resolve(new Response('{"a":1}', { status: 200 }));

        const out = await runHttpTool({ config, args: {}, envs: [], signal });

        expect(out).toBe('{\n  "a": 1\n}');
    });

    test("a redirect is refused, not followed", async () => {
        fetchImpl = (_url, init) => {
            expect(init.redirect).toBe("manual");
            return Promise.resolve(new Response("", { status: 302, headers: { location: "https://evil.example.com/" } }));
        };

        await expect(runHttpTool({ config, args: {}, envs: [], signal })).rejects.toThrow("redirect");
    });

    test("a non-2xx answer throws with its status", async () => {
        fetchImpl = () => Promise.resolve(new Response("nope", { status: 500, statusText: "Server Error" }));

        await expect(runHttpTool({ config, args: {}, envs: [], signal })).rejects.toThrow("HTTP 500");
    });

    test("an endless body is cut at the byte cap", async () => {
        const stream = new ReadableStream<Uint8Array>({
            start(ctrl) {
                const chunk = new Uint8Array(1024 * 1024).fill(120);
                ctrl.enqueue(chunk);
                ctrl.enqueue(chunk);
                ctrl.enqueue(chunk);
                ctrl.close();
            },
        });
        fetchImpl = () => Promise.resolve(new Response(stream, { status: 200 }));

        const out = await runHttpTool({ config, args: {}, envs: [], signal });

        expect(out).toContain(`cut at ${AppData.CustomToolResponseMaxBytes} bytes`);
    });
});
