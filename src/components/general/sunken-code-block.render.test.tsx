import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import SunkenCodeBlock from "./sunken-code-block";

/**
 * twui's CodeBlock is a fixed dark block with a white copy icon. Everywhere
 * the app shows code it wants the theme's sunken surface instead, so this
 * wrapper is the one place that decides that: a light-mode Details modal
 * once showed dark-on-dark text because the block stayed `#28272b`.
 */
describe("SunkenCodeBlock", () => {
    test("rides the theme's sunken surface", () => {
        const html = renderToString(<SunkenCodeBlock>ls -la</SunkenCodeBlock>);

        expect(html).toContain("var(--color-sunken)");
        expect(html).not.toContain("#28272b");
        expect(html).toContain("outline-hairline");
    });

    test("draws the copy icon and its label in ink", () => {
        const html = renderToString(<SunkenCodeBlock>ls</SunkenCodeBlock>);

        expect(html).toContain("stroke-ink-secondary");
        expect(html).toContain("twui-code-block-copied-text]:text-ink");
    });

    test("sets code at 13px, and only breaks anywhere when asked", () => {
        const closing = renderToString(<SunkenCodeBlock>{"a".repeat(40)}</SunkenCodeBlock>);
        const wrapping = renderToString(<SunkenCodeBlock wrapAnywhere>{"a".repeat(40)}</SunkenCodeBlock>);

        expect(closing).toContain("text-[13px]");
        expect(closing).not.toContain("wrap-anywhere");
        expect(wrapping).toContain("wrap-anywhere");
    });
});