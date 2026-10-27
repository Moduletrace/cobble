import { describe, expect, test } from "bun:test";
import graphicDocument from "./graphic-document";

const vars = {
    light: { "--c-paper": "#fff" },
    dark: { "--c-paper": "#000" },
    fonts: { "--font-sans": "sans-serif" },
};

describe("graphicDocument", () => {
    test("wraps a fragment in a themed document", () => {
        const doc = graphicDocument({ html: "<svg></svg>", title: "A <b>", vars });

        expect(doc.startsWith("<!DOCTYPE html><html><head>")).toBe(true);
        expect(doc).toContain("<title>A &lt;b&gt;</title>");
        expect(doc).toContain("--c-paper:#fff;");
        expect(doc).toContain(":root.dark{color-scheme:dark;--c-paper:#000;}");
        expect(doc).toContain("<body><svg></svg><script>");
        expect(doc).toContain("cobble:graphic-size");
    });

    test("styles scrollbars in the theme's colours", () => {
        const doc = graphicDocument({ html: "<p>x</p>", title: "T", vars });

        expect(doc).toContain("::-webkit-scrollbar-thumb{background-color:var(--c-border-strong);");
        expect(doc).toContain("scrollbar-color:var(--c-border-strong) transparent;");
    });

    test("puts the theme ahead of a whole document's own styles", () => {
        const doc = graphicDocument({
            html: `<!doctype html><html lang="en"><head><style>body{color:red}</style></head><body><p>Hi</p></body></html>`,
            title: "T",
            dark: true,
            vars,
        });

        expect(doc.indexOf("--c-paper")).toBeLessThan(doc.indexOf("body{color:red}"));
        expect(doc).toContain(`classList.toggle("dark", true)`);
        expect(doc.indexOf("cobble:graphic-size")).toBeLessThan(doc.lastIndexOf("</body>"));
        expect(doc.match(/<!doctype/gi)?.length).toBe(1);
    });

    test("gives a document without a head one", () => {
        const doc = graphicDocument({ html: `<html><body>x</body></html>`, title: "T", vars });

        expect(doc).toContain(`<html><head><meta charset="utf-8">`);
    });

    test("drops a refresh that would navigate the frame away", () => {
        const doc = graphicDocument({
            html: `<head><meta http-equiv="refresh" content="0;url=https://evil.test/?d=1"></head>`,
            title: "T",
            vars,
        });

        expect(doc).not.toContain("evil.test");
    });
});
