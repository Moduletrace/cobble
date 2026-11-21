import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import SidePanel from "./side-panel";

const onClose = () => {};

describe("SidePanel", () => {
    test("a closed panel waits off its edge, untabbed, with no backdrop", () => {
        const html = renderToString(
            <SidePanel side="left" open={false} onClose={onClose} label="Bots">
                <p>crew</p>
            </SidePanel>,
        );

        expect(html).toContain("-translate-x-full");
        expect(html).toContain("left-0");
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain("inert");
        expect(html).not.toContain("bg-ink/40");
        /**
         * Its contents are still in the page, ready to slide in.
         */
        expect(html).toContain("crew");
    });

    test("an open panel sits on its edge over a backdrop that closes it", () => {
        const html = renderToString(
            <SidePanel side="right" open onClose={onClose} label="Edit Ada">
                <p>form</p>
            </SidePanel>,
        );

        expect(html).toContain("right-0");
        expect(html).toContain("border-l");
        expect(html).toContain("translate-x-0");
        expect(html).not.toContain("translate-x-full");
        expect(html).not.toContain("inert");
        /**
         * The backdrop is the hidden-from-assistive-tech part; the panel
         * itself is a labelled region.
         */
        expect(html).toMatch(/<div aria-label="Edit Ada"/);
        expect(html).toContain("bg-ink/40");
        expect(html).toContain('aria-label="Edit Ada"');
    });

    test("both panel and backdrop keep a phone swipe from starting on them", () => {
        const html = renderToString(
            <SidePanel side="left" open onClose={onClose} label="Bots">
                <p>crew</p>
            </SidePanel>,
        );

        expect(html.match(/data-no-swipe/g)?.length).toBe(2);
    });

    test("a panel that is also part of the page is never inert", () => {
        const html = renderToString(
            <SidePanel
                side="left"
                open={false}
                onClose={onClose}
                label="Bots"
                inertWhenClosed={false}
            >
                <p>crew</p>
            </SidePanel>,
        );

        expect(html).not.toContain("inert");
        expect(html).not.toContain('aria-hidden="true"');
    });

    test("the caller's classes win over the panel's own", () => {
        const html = renderToString(
            <SidePanel
                side="left"
                open
                onClose={onClose}
                label="Bots"
                className="md:static md:w-16"
                backdropClassName="md:hidden"
            >
                <p>crew</p>
            </SidePanel>,
        );

        expect(html).toContain("md:w-16");
        expect(html).toContain("md:hidden");
    });
});