import { describe, expect, test } from "bun:test";
import needsPrecachePage from "./needs-precache-page";

const page = {
    method: "GET",
    pathname: "/admin/bots/1",
    fetch_dest: "document",
    build_id: "build-2",
};

describe("needsPrecachePage", () => {
    test("stands in for a page on a build the browser hasn't downloaded", () => {
        expect(needsPrecachePage(page)).toBe(true);
        expect(needsPrecachePage({ ...page, cookie_build_id: "build-1" })).toBe(true);
        expect(
            needsPrecachePage({ ...page, fetch_dest: "empty", fetch_mode: "navigate" }),
        ).toBe(true);
        expect(
            needsPrecachePage({ ...page, fetch_dest: null, accept: "text/html,*/*" }),
        ).toBe(true);
    });

    test("lets the current build through", () => {
        expect(needsPrecachePage({ ...page, cookie_build_id: "build-2" })).toBe(false);
    });

    test("never runs in development", () => {
        expect(needsPrecachePage({ ...page, build_id: null })).toBe(false);
    });

    test("leaves everything that isn't a page navigation", () => {
        expect(needsPrecachePage({ ...page, method: "POST" })).toBe(false);
        expect(needsPrecachePage({ ...page, fetch_dest: "script" })).toBe(false);
        expect(
            needsPrecachePage({
                ...page,
                fetch_dest: "empty",
                fetch_mode: "cors",
                accept: "text/html",
            }),
        ).toBe(false);
        expect(needsPrecachePage({ ...page, fetch_dest: null, accept: "*/*" })).toBe(false);
        expect(needsPrecachePage({ ...page, pathname: "/api/admin/bots/send-message" })).toBe(false);
        expect(needsPrecachePage({ ...page, pathname: "/.bunext/public/vendor/react.js" })).toBe(false);
        expect(needsPrecachePage({ ...page, pathname: "/computers/2/vnc/vnc.html" })).toBe(false);
        expect(needsPrecachePage({ ...page, pathname: "/media/1/private/a" })).toBe(false);
        expect(needsPrecachePage({ ...page, pathname: "/build-info.json" })).toBe(false);
        expect(needsPrecachePage({ ...page, pathname: "/sw.js" })).toBe(false);
    });
});
