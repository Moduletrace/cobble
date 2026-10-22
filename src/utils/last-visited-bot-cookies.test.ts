import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import lastVisitedBotCookies from "./last-visited-bot-cookies";
import { setCookies } from "./cookies";
import readLastVisitedBot from "./read-last-visited-bot";

const bot_cookie = AppData["LastVisitedBotCookieName"];
const workspace_cookie = AppData["LastVisitedWorkspaceCookieName"];

function requestWithCookies(): Request {
    const res = new Response();
    setCookies(
        res,
        lastVisitedBotCookies({ bot_id: 4, workspace_id: 9, secure: false }),
    );
    const cookie_header = res.headers
        .getSetCookie()
        .map((header) => header.split(";")[0])
        .join("; ");

    return new Request("http://localhost/admin/bots", {
        headers: { Cookie: cookie_header },
    });
}

describe("last visited bot cookies", () => {
    test("round-trip a workspace conversation", () => {
        expect(readLastVisitedBot({ req: requestWithCookies() })).toEqual({
            bot_id: 4,
            workspace_id: 9,
        });
    });

    test("a bot's own chat leaves the workspace cookie empty", () => {
        const res = new Response();
        setCookies(res, lastVisitedBotCookies({ bot_id: 4, secure: false }));
        const cookie_header = res.headers
            .getSetCookie()
            .map((header) => header.split(";")[0])
            .join("; ");

        const req = new Request("http://localhost", {
            headers: { Cookie: cookie_header },
        });

        expect(readLastVisitedBot({ req })).toEqual({ bot_id: 4, workspace_id: null });
    });

    test("no cookies at all", () => {
        expect(readLastVisitedBot({ req: new Request("http://localhost") })).toBeNull();
    });

    test("only the workspace cookie names no conversation", () => {
        const req = new Request("http://localhost", {
            headers: { Cookie: `${workspace_cookie}=9` },
        });
        expect(readLastVisitedBot({ req })).toBeNull();
    });

    test("a tampered bot id is ignored", () => {
        const req = new Request("http://localhost", {
            headers: { Cookie: `${bot_cookie}=1%20OR%201=1` },
        });
        expect(readLastVisitedBot({ req })).toBeNull();
    });

    test("they are HttpOnly, long-lived and not Secure on plain HTTP", () => {
        const res = new Response();
        setCookies(
            res,
            lastVisitedBotCookies({ bot_id: 4, secure: false }),
        );
        const [header] = res.headers.getSetCookie();

        expect(header).toContain("HttpOnly");
        expect(header).toContain(`Max-Age=${AppData["LastVisitedCookieMaxAgeSeconds"]}`);
        expect(header).not.toContain("Secure");
    });
});
