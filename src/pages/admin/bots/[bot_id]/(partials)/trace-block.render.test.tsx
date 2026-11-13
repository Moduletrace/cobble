import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { TracePreviewChars } from "../(utils)/trace-entry-view";
import TraceBlock from "./trace-block";

/**
 * A trace block is read inside the Details modal and the debug strip, on
 * whichever theme the user has. Code used to come out of twui's own dark
 * block (a fixed `#28272b`), which left dark-on-dark text in light mode and
 * set the block larger than the log around it.
 */
describe("TraceBlock", () => {
    test("code sits on the theme's sunken surface, never twui's dark block", () => {
        const html = renderToString(<TraceBlock label="What it was sent" kind="code" text={'{"command":"ls"}'} />);

        expect(html).toContain("var(--color-sunken)");
        expect(html).not.toContain("#28272b");
        expect(html).toContain("text-ink");
    });

    test("code and prose share the log's size", () => {
        const code = renderToString(<TraceBlock kind="code" text={"ls -la"} />);
        const prose = renderToString(<TraceBlock text="Two tabs are open." />);

        expect(code).toContain("text-[13px]");
        expect(code).toContain("leading-5");
        expect(prose).toContain("text-[13px]");
        expect(prose).toContain("leading-5");
    });

    test("a long text is cut until it is opened", () => {
        const text = `start ${"x".repeat(TracePreviewChars)}end`;

        const cut = renderToString(<TraceBlock kind="code" text={text} />);
        const whole = renderToString(<TraceBlock kind="code" text="short" />);

        expect(cut).toContain("start");
        expect(cut).not.toContain("end");
        expect(cut).toContain(`Show all ${text.length.toLocaleString()} characters`);
        expect(whole).not.toContain("Show all");
    });
});