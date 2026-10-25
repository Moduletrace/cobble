import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import computerProxyResponseHeaders, { computerProxyCookies } from "./computer-proxy-response-headers";

const prefix = "/computers/3";

describe("computerProxyCookies", () => {
    test("keeps a sandbox cookie to the computer's prefix", () => {
        expect(
            computerProxyCookies({ cookies: ["key=abc; Path=/; HttpOnly; Domain=example.com"], prefix }),
        ).toEqual(["key=abc; HttpOnly; Path=/computers/3/"]);
    });

    test("drops a cookie named like the app's session", () => {
        expect(
            computerProxyCookies({
                cookies: [`${AppData.AuthKeyCookieName}=forged; Path=/`, `${AppData.AuthCSRFCookieName}=x`, "ok=1"],
                prefix,
            }),
        ).toEqual(["ok=1; Path=/computers/3/"]);
    });
});

describe("computerProxyResponseHeaders", () => {
    test("rewrites every Set-Cookie and keeps framing open", () => {
        const headers = new Headers();

        headers.append("set-cookie", "a=1; Path=/");
        headers.append("set-cookie", `${AppData.AuthKeyCookieName}=forged; Path=/`);
        headers.set("x-frame-options", "DENY");

        const out = computerProxyResponseHeaders({ headers, base_url: "http://computer:8080", prefix });

        expect(out.getSetCookie()).toEqual(["a=1; Path=/computers/3/"]);
        expect(out.get("x-frame-options")).toBeNull();
    });

    test("points a redirect back under the prefix", () => {
        const headers = new Headers({ location: "http://computer:8080/vnc/index.html" });
        const out = computerProxyResponseHeaders({ headers, base_url: "http://computer:8080", prefix });

        expect(out.get("location")).toBe("/computers/3/vnc/index.html");
    });
});
