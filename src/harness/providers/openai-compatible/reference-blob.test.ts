import { afterAll, afterEach, beforeEach, describe, expect, test } from "bun:test";

const { default: referenceBlob } = await import("./reference-blob");

const realFetch = globalThis.fetch;
let fetchImpl: (url: any, init?: any) => Promise<Response> = async () => {
    throw new Error("fetch was not stubbed for this test");
};
const signal = new AbortController().signal;

beforeEach(() => {
    fetchImpl = async () => {
        throw new Error("fetch was not stubbed for this test");
    };
    globalThis.fetch = ((url: any, init?: any) => fetchImpl(url, init)) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

afterAll(() => {
    globalThis.fetch = realFetch;
});

describe("referenceBlob guards the download branch (R7)", () => {
    test("a data URL is decoded inline, never fetched", async () => {
        const url = `data:image/png;base64,${Buffer.from("hi").toString("base64")}`;
        const { blob, ext } = await referenceBlob({ url, signal });
        expect(ext).toBe("png");
        expect(blob.type).toBe("image/png");
        expect(new Uint8Array(await blob.arrayBuffer())).toEqual(Uint8Array.from(Buffer.from("hi")));
    });

    test("an http reference URL is refused", async () => {
        await expect(referenceBlob({ url: "http://cdn.example.com/1.png", signal })).rejects.toThrow(/https/);
    });

    test("an internal reference URL is refused", async () => {
        await expect(referenceBlob({ url: "https://10.0.0.5/1.png", signal })).rejects.toThrow(/internal/);
    });

    test("a public https reference is downloaded and returned", async () => {
        fetchImpl = async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg" } });
        const { blob, ext } = await referenceBlob({ url: "https://cdn.example.com/1.jpg", signal });
        expect(ext).toBe("jpeg");
        expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    });
});
