import { describe, expect, test } from "bun:test";
import shouldPastePlainText from "./should-paste-plain-text";

describe("should paste plain text", () => {
    test("replays another site's rich paste as plain text", () => {
        expect(
            shouldPastePlainText({
                html: '<meta charset="utf-8"><span>GROK_BOT_MAILBOX_PASSWORD</span>',
                text: "GROK_BOT_MAILBOX_PASSWORD",
            }),
        ).toBe(true);
        expect(shouldPastePlainText({ html: "<p>line one</p><p>line two</p>", text: "one\ntwo" })).toBe(true);
    });

    test("keeps our own copies formatted", () => {
        expect(
            shouldPastePlainText({
                html: '<p data-pm-slice="1 1 []"><strong>bold</strong></p>',
                text: "**bold**",
            }),
        ).toBe(false);
    });

    test("leaves a plain paste and a file paste alone", () => {
        expect(shouldPastePlainText({ html: "", text: "just text" })).toBe(false);
        expect(shouldPastePlainText({ html: '<img src="blob:x">', text: "" })).toBe(false);
        expect(shouldPastePlainText({ html: "", text: "" })).toBe(false);
    });
});
