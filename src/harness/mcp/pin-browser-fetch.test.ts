import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import pinBrowserFetch from "./pin-browser-fetch";

const realFetch = globalThis.fetch;
let seen: { url: URL; init: RequestInit }[] = [];

beforeEach(() => {
    seen = [];
    globalThis.fetch = ((url: URL, init: RequestInit) => {
        seen.push({ url, init });

        return Promise.resolve(new Response("ok"));
    }) as typeof fetch;
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("pinBrowserFetch", () => {
    test("connects to the checked IP, keeping the original Host and TLS name", async () => {
        const endpoint = new URL("https://browser.example.com:8443/mcp");
        const pinned = pinBrowserFetch({ endpoint, addresses: ["93.184.216.34"] });

        await pinned(endpoint, { headers: { Authorization: "Bearer x" } });

        const call = seen[0]!;

        expect(call.url.hostname).toBe("93.184.216.34");
        expect(call.url.port).toBe("8443");
        expect(call.url.pathname).toBe("/mcp");
        expect(new Headers(call.init.headers).get("Host")).toBe("browser.example.com:8443");
        expect(new Headers(call.init.headers).get("Authorization")).toBe("Bearer x");
        expect((call.init as { tls?: { serverName?: string } }).tls?.serverName).toBe("browser.example.com");
    });

    test("brackets an IPv6 address and keeps the name for TLS", async () => {
        const endpoint = new URL("https://browser.example.com/mcp");
        const pinned = pinBrowserFetch({ endpoint, addresses: ["2606:4700::1"] });

        await pinned("https://browser.example.com/mcp");

        expect(seen[0]!.url.hostname).toBe("[2606:4700::1]");
        expect((seen[0]!.init as { tls?: { serverName?: string } }).tls?.serverName).toBe("browser.example.com");
    });

    test("a plain http endpoint needs no TLS name", async () => {
        const endpoint = new URL("http://192.168.1.40:3000/mcp");
        const pinned = pinBrowserFetch({ endpoint, addresses: ["192.168.1.40"] });

        await pinned(endpoint);

        expect(seen[0]!.url.hostname).toBe("192.168.1.40");
        expect((seen[0]!.init as { tls?: unknown }).tls).toBeUndefined();
    });
});
