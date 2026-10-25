import { describe, expect, test } from "bun:test";
import isSameOriginUpgrade from "./is-same-origin-upgrade";

function upgrade({ headers }: { headers: Record<string, string> }) {
    return new Request("http://localhost:7227/ws", { headers });
}

describe("isSameOriginUpgrade", () => {
    test("the app's own page is let through", () => {
        expect(
            isSameOriginUpgrade({
                req: upgrade({ headers: { origin: "http://10.8.0.1:7227", host: "10.8.0.1:7227" } }),
            }),
        ).toBe(true);
    });

    test("behind a proxy that forwards the host", () => {
        expect(
            isSameOriginUpgrade({
                req: upgrade({
                    headers: {
                        origin: "https://cobble.example.com",
                        host: "127.0.0.1:7227",
                        "x-forwarded-host": "cobble.example.com",
                    },
                }),
            }),
        ).toBe(true);
    });

    test("another port on the same machine is refused", () => {
        expect(
            isSameOriginUpgrade({
                req: upgrade({ headers: { origin: "http://localhost:8080", host: "localhost:7227" } }),
            }),
        ).toBe(false);
    });

    test("another site is refused", () => {
        expect(
            isSameOriginUpgrade({
                req: upgrade({ headers: { origin: "https://evil.example", host: "cobble.example.com" } }),
            }),
        ).toBe(false);
    });

    test("a malformed or opaque origin is refused", () => {
        expect(isSameOriginUpgrade({ req: upgrade({ headers: { origin: "null", host: "localhost:7227" } }) })).toBe(false);
    });

    test("a client without an origin is left to the sign-in check", () => {
        expect(isSameOriginUpgrade({ req: upgrade({ headers: { host: "localhost:7227" } }) })).toBe(true);
    });
});
