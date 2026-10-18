import { describe, expect, test } from "bun:test";
import sanitizeRichTextHtml from "./sanitize-rich-text-html";

describe("sanitizeRichTextHtml", () => {
    test("returns an empty string for empty input", () => {
        expect(sanitizeRichTextHtml({ html: "" })).toBe("");
        expect(sanitizeRichTextHtml({ html: null })).toBe("");
        expect(sanitizeRichTextHtml({})).toBe("");
    });

    test("keeps safe formatting", () => {
        expect(
            sanitizeRichTextHtml({
                html: "<p>Hello <strong>world</strong></p>",
            }),
        ).toBe("<p>Hello <strong>world</strong></p>");
    });

    test("strips script tags and their contents", () => {
        const clean = sanitizeRichTextHtml({
            html: `<p>Hi</p><script>alert("xss")</script>`,
        });

        expect(clean).toBe("<p>Hi</p>");
        expect(clean).not.toContain("script");
    });

    test("strips event handler attributes", () => {
        const clean = sanitizeRichTextHtml({
            html: `<p onclick="alert(1)">Hi</p><img src="x" onerror="alert(1)">`,
        });

        expect(clean).not.toContain("onclick");
        expect(clean).not.toContain("onerror");
    });

    test("strips unsafe URL schemes, including encoded ones", () => {
        const clean = sanitizeRichTextHtml({
            html: [
                `<a href="javascript:alert(1)">a</a>`,
                `<a href="jav&#x61;script:alert(1)">b</a>`,
                `<a href="data:text/html,<script>alert(1)</script>">c</a>`,
            ].join(""),
        });

        expect(clean).not.toContain("javascript");
        expect(clean).not.toContain("data:");
    });

    test("strips iframes and forms", () => {
        const clean = sanitizeRichTextHtml({
            html: `<iframe src="https://example.com"></iframe><form><input></form><p>ok</p>`,
        });

        expect(clean).toBe("<p>ok</p>");
    });

    test("adds rel=noopener to links", () => {
        const clean = sanitizeRichTextHtml({
            html: `<a href="https://example.com" target="_blank">x</a>`,
        });

        expect(clean).toContain(`rel="noopener noreferrer"`);
    });
});
