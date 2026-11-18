import { describe, expect, test } from "bun:test";
import markdownHeadings from "./markdown-headings";

describe("markdownHeadings", () => {
    test("reads every level, in order, without the marks", () => {
        expect(
            markdownHeadings({
                text: "# Workspace\n\nSome text.\n\n## Products and services\n### Detail\n",
            }),
        ).toEqual(["Workspace", "Products and services", "Detail"]);
    });

    test("leaves out a line inside a fenced code block", () => {
        expect(
            markdownHeadings({
                text: "# Real\n\n```bash\n# a shell comment\n## not a heading\n```\n\n## Also real",
            }),
        ).toEqual(["Real", "Also real"]);
    });

    test("leaves out a tilde fence and its contents too", () => {
        expect(markdownHeadings({ text: "~~~\n# comment\n~~~\n# Real" })).toEqual(["Real"]);
    });

    test("leaves out a shebang line", () => {
        expect(markdownHeadings({ text: "#!/usr/bin/env bash\n# Real" })).toEqual(["Real"]);
    });

    test("needs a space after the marks", () => {
        expect(markdownHeadings({ text: "#hashtag\n# Real" })).toEqual(["Real"]);
    });

    test("drops a closing run of marks", () => {
        expect(markdownHeadings({ text: "## Standing rules ##" })).toEqual(["Standing rules"]);
    });

    test("is empty for no text", () => {
        expect(markdownHeadings({ text: null })).toEqual([]);
        expect(markdownHeadings({ text: "Just prose." })).toEqual([]);
    });
});