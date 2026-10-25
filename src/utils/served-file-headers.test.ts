import { describe, expect, test } from "bun:test";
import servedFileHeaders, { isActiveContentType } from "./served-file-headers";

describe("isActiveContentType", () => {
    test("pages, SVG, XML and scripts are active", () => {
        for (const content_type of [
            "text/html",
            "text/html; charset=utf-8",
            "TEXT/HTML",
            "image/svg+xml",
            "application/xhtml+xml",
            "application/xml",
            "application/rss+xml",
            "text/javascript",
        ]) {
            expect(isActiveContentType({ content_type })).toBe(true);
        }
    });

    test("images, PDFs, audio and plain text are not", () => {
        for (const content_type of ["image/png", "application/pdf", "audio/mpeg", "text/plain", "text/markdown", "", null]) {
            expect(isActiveContentType({ content_type })).toBe(false);
        }
    });
});

describe("servedFileHeaders", () => {
    test("every file is served without sniffing", () => {
        expect(servedFileHeaders({ content_type: "application/pdf" })).toEqual({
            "X-Content-Type-Options": "nosniff",
        });
    });

    test("an active file is sandboxed", () => {
        expect(servedFileHeaders({ content_type: "text/html" })).toEqual({
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
        });
    });
});
