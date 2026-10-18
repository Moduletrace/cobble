import { expect, test } from "bun:test";
import htmlToTextBlocks from "./html-blocks";

test("parses paragraphs and inline styles", () => {
    const blocks = htmlToTextBlocks(
        `<p>Hello <strong>world</strong> and <em>friends</em>.</p><p>Second <u>underlined</u> paragraph.</p>`,
    );

    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.type).toBe("paragraph");
    expect((blocks[0] as any).segments).toEqual([
        { text: "Hello " },
        { text: "world", bold: true },
        { text: " and " },
        { text: "friends", italic: true },
        { text: "." },
    ]);
    expect((blocks[1] as any).segments).toEqual([
        { text: "Second " },
        { text: "underlined", underline: true },
        { text: " paragraph." },
    ]);
});

test("parses lists with ordering", () => {
    const blocks = htmlToTextBlocks(
        `<ul><li>One</li><li>Two</li></ul><ol><li>First</li></ol>`,
    );

    expect(blocks).toHaveLength(3);
    expect(blocks[0]!).toEqual({
        type: "list-item",
        ordered: false,
        index: 0,
        segments: [{ text: "One" }],
    });
    expect(blocks[1]!).toEqual({
        type: "list-item",
        ordered: false,
        index: 1,
        segments: [{ text: "Two" }],
    });
    expect(blocks[2]!).toEqual({
        type: "list-item",
        ordered: true,
        index: 0,
        segments: [{ text: "First" }],
    });
});

test("parses headings, blockquote, hr and br", () => {
    const blocks = htmlToTextBlocks(
        `<h2>Heading</h2><blockquote>Quoted</blockquote><hr><p>Line one<br>Line two</p>`,
    );

    expect(blocks[0]!.type).toBe("heading");
    expect((blocks[0] as any).level).toBe(2);
    expect(blocks[1]!.type).toBe("blockquote");
    expect(blocks[2]!).toEqual({ type: "divider" });
    // <br> splits into separate paragraphs
    expect(blocks).toHaveLength(5);
    expect((blocks[3] as any).segments.map((s: any) => s.text).join("")).toBe(
        "Line one",
    );
    expect((blocks[4] as any).segments.map((s: any) => s.text).join("")).toBe(
        "Line two",
    );
});

test("decodes HTML entities", () => {
    const blocks = htmlToTextBlocks(
        `<p>Fee &amp; charges &mdash; &#163;500 &gt; 400</p>`,
    );

    expect((blocks[0] as any).segments[0].text).toBe(
        "Fee & charges \u2014 \u00a3500 > 400",
    );
});

test("uses img alt text and ignores unknown tags", () => {
    const blocks = htmlToTextBlocks(
        `<p>See <img src="x.png" alt="the chart" /> below.</p><svg><circle></circle></svg>`,
    );

    expect((blocks[0] as any).segments.map((s: any) => s.text).join("")).toBe(
        "See  the chart  below.",
    );
});

test("returns empty for empty input", () => {
    expect(htmlToTextBlocks(undefined)).toEqual([]);
    expect(htmlToTextBlocks("")).toEqual([]);
});