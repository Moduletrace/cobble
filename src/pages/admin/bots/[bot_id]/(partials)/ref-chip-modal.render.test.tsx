import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import Button from "@moduletrace/twui/layout/Button";
import P from "@moduletrace/twui/layout/P";
import Span from "@moduletrace/twui/layout/Span";
import RefChipModal from "./ref-chip-modal";

/**
 * A ref chip sits in a markdown paragraph, which takes phrasing content
 * only. twui's own `Modal` target wrapper is a div, so the chip used to
 * put a div in the paragraph and React logged "p cannot contain a nested
 * div" for every question or proposal chip on the page.
 */
describe("RefChipModal", () => {
    test("wraps its trigger in a span, with no block element beside it", () => {
        const html = renderToString(
            <P noMargin>
                <RefChipModal trigger={<Button type="button" title="Review">Review</Button>} open={false} onClose={() => {}}>
                    <Span>Card</Span>
                </RefChipModal>
            </P>,
        );

        // twui's own Button fills itself with a div, valid inside a button
        // (React only warns about a p in button scope), so the paragraph
        // is broken only by a div before the button: twui's Modal used to
        // wrap its target in one.
        const first_button = html.indexOf("<button");

        expect(html).toContain('<span class="twui-span inline-flex max-w-full align-middle">');
        expect(html).toContain("Review");
        expect(first_button).toBeGreaterThan(-1);
        expect(html.slice(0, first_button)).not.toContain("<div");
    });

    test("mounts the card only while open", () => {
        const html = renderToString(
            <RefChipModal trigger={<Button type="button" title="Review">Review</Button>} open={false} onClose={() => {}}>
                <Span>Card</Span>
            </RefChipModal>,
        );

        expect(html).not.toContain("Card");
    });
});