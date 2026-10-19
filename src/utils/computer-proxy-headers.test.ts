import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import computerProxyRequestHeaders from "./computer-proxy-request-headers";
import computerProxyResponseHeaders from "./computer-proxy-response-headers";

describe("computerProxyRequestHeaders", () => {
    test("drops the app's session cookies and forwards where it's served", () => {
        const headers = computerProxyRequestHeaders({
            headers: new Headers({
                host: "localhost:7227",
                cookie: `${AppData.AuthKeyCookieName}=secret; ${AppData.AuthCSRFCookieName}=csrf; _xsrf=keep`,
                "user-agent": "test",
            }),
            url: new URL("http://localhost:7227/computers/3/terminal"),
            prefix: "/computers/3",
        });

        expect(headers.get("cookie")).toBe("_xsrf=keep");
        expect(headers.get("host")).toBeNull();
        expect(headers.get("user-agent")).toBe("test");
        expect(headers.get("x-forwarded-host")).toBe("localhost:7227");
        expect(headers.get("x-forwarded-proto")).toBe("http");
        expect(headers.get("x-forwarded-prefix")).toBe("/computers/3");
    });

    test("sends no cookie header when only the app's were set", () => {
        const headers = computerProxyRequestHeaders({
            headers: new Headers({ cookie: `${AppData.AuthKeyCookieName}=secret` }),
            url: new URL("https://cobble.local/computers/3/"),
            prefix: "/computers/3",
        });

        expect(headers.get("cookie")).toBeNull();
        expect(headers.get("x-forwarded-proto")).toBe("https");
    });
});

describe("computerProxyResponseHeaders", () => {
    const base_url = "http://cobble-computer:8080";
    const prefix = "/computers/3";

    test("lets the chat frame the computer", () => {
        const headers = computerProxyResponseHeaders({
            headers: new Headers({
                "x-frame-options": "DENY",
                "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
            }),
            base_url,
            prefix,
        });

        expect(headers.get("x-frame-options")).toBeNull();
        expect(headers.get("content-security-policy")).toBe("default-src 'self'");
    });

    test("points redirects back under the prefix", () => {
        const location = (value: string) =>
            computerProxyResponseHeaders({ headers: new Headers({ location: value }), base_url, prefix }).get(
                "location",
            );

        expect(location("http://cobble-computer:8080/jupyter/lab")).toBe("/computers/3/jupyter/lab");
        expect(location("/code-server?folder=/home/gem")).toBe("/computers/3/code-server?folder=/home/gem");
        expect(location("/computers/3/terminal")).toBe("/computers/3/terminal");
        expect(location("./?folder=/home/gem")).toBe("./?folder=/home/gem");
        expect(location("https://example.com/")).toBe("https://example.com/");
    });
});
