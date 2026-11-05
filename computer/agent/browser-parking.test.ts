import { describe, expect, test } from "bun:test";
import pageNeedsParking from "./page-needs-parking";
import parkAfterMs from "./park-after-ms";
import shouldParkBrowser from "./should-park-browser";

const idle = { now: 1_000_000, last_active_at: 1_000_000 - 180_000, checked_at: 0, viewers: 0, holds: 0, park_after_ms: 180_000 };

describe("shouldParkBrowser", () => {
    test("parks once it sat unused and unwatched long enough", () => {
        expect(shouldParkBrowser(idle)).toBe(true);
        expect(shouldParkBrowser({ ...idle, last_active_at: idle.now - 179_999 })).toBe(false);
    });

    test("never while someone watches the screen or a tool call runs", () => {
        expect(shouldParkBrowser({ ...idle, viewers: 1 })).toBe(false);
        expect(shouldParkBrowser({ ...idle, holds: 1 })).toBe(false);
    });

    test("looks only once per idle stretch", () => {
        expect(shouldParkBrowser({ ...idle, checked_at: idle.last_active_at + 1 })).toBe(false);
        expect(shouldParkBrowser({ ...idle, checked_at: idle.last_active_at - 1 })).toBe(true);
    });

    test("0 turns it off", () => {
        expect(shouldParkBrowser({ ...idle, park_after_ms: 0, last_active_at: 0 })).toBe(false);
    });
});

describe("pageNeedsParking", () => {
    test("sites do, Chrome's own pages don't", () => {
        expect(pageNeedsParking({ url: "https://www.youtube.com/watch?v=x" })).toBe(true);
        expect(pageNeedsParking({ url: "file:///tmp/a.html" })).toBe(true);

        for (const url of ["about:blank", "chrome://newtab/", "chrome-untrusted://new-tab-page/", "chrome-error://chromewebdata/", "devtools://devtools/x"]) {
            expect(pageNeedsParking({ url })).toBe(false);
        }
    });
});

describe("parkAfterMs", () => {
    test("whole seconds, 0 for off, else 3 minutes", () => {
        expect(parkAfterMs({ text: "60" })).toBe(60_000);
        expect(parkAfterMs({ text: "0" })).toBe(0);
        expect(parkAfterMs({ text: undefined })).toBe(180_000);
        expect(parkAfterMs({ text: "-5" })).toBe(180_000);
        expect(parkAfterMs({ text: "1.5" })).toBe(180_000);
    });
});
