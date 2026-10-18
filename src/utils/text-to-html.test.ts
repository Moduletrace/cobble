import { expect, test } from "bun:test";
import textToSafeHtml from "./text-to-html";

test("textToSafeHtml passes HTML through unchanged", () => {
    const html = `<p>Payment may be split: <strong>30% deposit</strong>.</p>`;
    expect(textToSafeHtml(html)).toBe(html);
});

test("textToSafeHtml converts legacy plain-text line breaks", () => {
    expect(textToSafeHtml("Line one\nLine two")).toBe(
        "Line one<br />Line two",
    );
    expect(textToSafeHtml("A\r\nB\r\nC")).toBe("A<br />B<br />C");
});

test("textToSafeHtml handles empty and plain single-line input", () => {
    expect(textToSafeHtml("")).toBe("");
    expect(textToSafeHtml("Just a note")).toBe("Just a note");
    expect(textToSafeHtml(undefined)).toBe("");
});