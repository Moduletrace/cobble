import { describe, expect, test } from "bun:test";
import buildHttpsRedirectUrl from "./build-https-redirect-url";

const redirect = (url: string, https_port: string | number = 7227) =>
    buildHttpsRedirectUrl({ request_url: new URL(url), https_port });

describe("buildHttpsRedirectUrl", () => {
    test("moves the request to the HTTPS port", () => {
        expect(redirect("http://localhost:7228/")).toBe(
            "https://localhost:7227/",
        );
    });

    test("keeps the path and the query", () => {
        expect(redirect("http://localhost:7228/admin/bots?a=1&b=2")).toBe(
            "https://localhost:7227/admin/bots?a=1&b=2",
        );
    });

    test("keeps an IPv6 literal valid", () => {
        expect(redirect("http://[::1]:7228/login")).toBe(
            "https://[::1]:7227/login",
        );
    });

    test("uses the host the browser asked for", () => {
        expect(redirect("http://cobble.tailnet.ts.net:7228/")).toBe(
            "https://cobble.tailnet.ts.net:7227/",
        );
    });
});
