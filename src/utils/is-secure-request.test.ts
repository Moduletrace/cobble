import { describe, expect, test } from "bun:test";
import isSecureRequest from "./is-secure-request";

describe("isSecureRequest", () => {
    test("plain HTTP on a VPN address is not secure", () => {
        const req = new Request("http://10.8.0.1:7247/api/auth/password-login");
        expect(isSecureRequest({ req })).toBe(false);
    });

    test("an HTTPS request is secure", () => {
        const req = new Request("https://cobble.example.com/");
        expect(isSecureRequest({ req })).toBe(true);
    });

    test("trusts the proxy's forwarded scheme", () => {
        const req = new Request("http://localhost:7247/", {
            headers: { "X-Forwarded-Proto": "https" },
        });
        expect(isSecureRequest({ req })).toBe(true);
    });

    test("reads the first of several forwarded schemes", () => {
        const req = new Request("https://cobble.example.com/", {
            headers: { "X-Forwarded-Proto": "http, https" },
        });
        expect(isSecureRequest({ req })).toBe(false);
    });
});
