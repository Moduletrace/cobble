import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import MessageDetailsTabButton from "./message-details-tab-button";

/**
 * The Details modal's tabs: the one showing is filled in ink with on-ink
 * text (readable in both themes), the other stays quiet.
 */
describe("MessageDetailsTabButton", () => {
    test("the selected tab is pressed and filled", () => {
        const html = renderToString(
            <MessageDetailsTabButton label="Debug logs" selected onSelect={() => {}} />,
        );

        expect(html).toContain("Debug logs");
        expect(html).toContain("bg-ink");
        expect(html).toContain("text-on-ink");
        expect(html).toContain('aria-pressed="true"');
    });

    test("the other tab is quiet until picked", () => {
        const html = renderToString(
            <MessageDetailsTabButton label="Details" selected={false} onSelect={() => {}} />,
        );

        expect(html).toContain("Details");
        expect(html).not.toContain("text-on-ink");
        expect(html).toContain('aria-pressed="false"');
    });
});