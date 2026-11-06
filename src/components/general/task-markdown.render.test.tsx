import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import TaskMarkdown from "./task-markdown";

describe("TaskMarkdown", () => {
    test("renders the markdown, not as written", () => {
        const html = renderToString(<TaskMarkdown text={"## Steps\n\n- **Check** the [docs](https://example.com)"} />);

        expect(html).not.toContain("## Steps");
        expect(html).not.toContain("**Check**");
        expect(html).toContain("<li");
        expect(html).toContain("Check");
    });

    test("opens links in a new tab, bare ones too", () => {
        const html = renderToString(<TaskMarkdown text={"See [the docs](https://example.com) or https://example.org"} />);

        expect(html).toContain('href="https://example.com"');
        expect(html).toContain('href="https://example.org"');
        expect(html.match(/target="_blank"/g)?.length).toBe(2);
        expect(html).toContain("noopener");
    });

    test("shows refs as chips", () => {
        const html = renderToString(<TaskMarkdown text={"Ask [bot:2] about [task:20]."} />);

        expect(html).not.toContain("[bot:2]");
        expect(html).toContain("bot 2");
        expect(html).toContain("Task 20");
    });

    test("never renders raw HTML", () => {
        const html = renderToString(<TaskMarkdown text={"<script>alert(1)</script> <b>hi</b>"} />);

        expect(html).not.toContain("<script>");
        expect(html).not.toContain("<b>");
    });
});
