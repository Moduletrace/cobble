import { describe, expect, test } from "bun:test";
import type { CookieOptions } from "./cookies";
import {
    deleteCookies,
    getCookie,
    setCookies,
} from "./cookies";

describe("getCookie", () => {
    test("extracts a single cookie", () => {
        const req = new Request("http://localhost", {
            headers: { Cookie: `bmp_auth_key=abc123` },
        });
        expect(getCookie(req, "bmp_auth_key")).toBe("abc123");
    });

    test("extracts a cookie from multiple", () => {
        const req = new Request("http://localhost", {
            headers: { Cookie: `foo=1; bmp_auth_key=abc; bar=2` },
        });
        expect(getCookie(req, "bmp_auth_key")).toBe("abc");
    });

    test("handles values with equals signs", () => {
        const req = new Request("http://localhost", {
            headers: { Cookie: `bmp_auth_key=a=b=c` },
        });
        expect(getCookie(req, "bmp_auth_key")).toBe("a=b=c");
    });

    test("returns undefined on empty or missing header", () => {
        const no_header = new Request("http://localhost");
        expect(getCookie(no_header, "bmp_auth_key")).toBeUndefined();

        const empty = new Request("http://localhost", {
            headers: { Cookie: "" },
        });
        expect(getCookie(empty, "bmp_auth_key")).toBeUndefined();
    });

    test("returns undefined for a missing cookie name", () => {
        const req = new Request("http://localhost", {
            headers: { Cookie: `foo=1` },
        });
        expect(getCookie(req, "bmp_auth_key")).toBeUndefined();
    });
});

describe("setCookies", () => {
    test("applies secure defaults", () => {
        const res = new Response();
        setCookies(res, [{ name: "bmp_auth_key", value: "abc" }]);

        const [header] = res.headers.getSetCookie();
        expect(header).toContain(`bmp_auth_key=abc`);
        expect(header).toContain("HttpOnly");
        expect(header).toContain("Secure");
        expect(header).toContain("SameSite=Lax");
        expect(header).toContain("Path=/");
    });

    test("appends multiple cookies without overwriting", () => {
        const res = new Response();
        setCookies(res, [
            { name: "bmp_auth_key", value: "abc" },
            { name: "bmp_auth_csrf", value: "xyz" },
        ]);
        expect(res.headers.getSetCookie()).toHaveLength(2);
    });

    test("honors maxAge and custom options", () => {
        const res = new Response();
        setCookies(res, [
            {
                name: "bmp_auth_key",
                value: "abc",
                maxAge: 3600,
                sameSite: "Strict",
                path: "/admin",
                httpOnly: false,
                secure: false,
            },
        ]);

        const [header] = res.headers.getSetCookie();
        expect(header).toContain("Max-Age=3600");
        expect(header).toContain("SameSite=Strict");
        expect(header).toContain("Path=/admin");
        expect(header).not.toContain("HttpOnly");
        expect(header).not.toContain("Secure");
    });
});

describe("deleteCookies", () => {
    test("expires the named cookies", () => {
        const res = new Response();
        deleteCookies(res, [
            { name: "bmp_auth_key", httpOnly: true },
            { name: "bmp_auth_csrf", httpOnly: true },
        ]);

        const headers = res.headers.getSetCookie();
        expect(headers).toHaveLength(2);
        for (const header of headers) {
            expect(header).toContain("Max-Age=0");
            expect(header).toContain("bmp_");
        }
    });
});