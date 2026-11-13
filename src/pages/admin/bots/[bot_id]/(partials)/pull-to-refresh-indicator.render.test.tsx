import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import PullToRefreshIndicator from "./pull-to-refresh-indicator";

const reload = async () => {};

describe("PullToRefreshIndicator", () => {
    test("shows nothing until the thread is pulled", () => {
        expect(
            renderToString(<PullToRefreshIndicator state="idle" onReload={reload} />),
        ).toBe("");
    });

    test("is one icon in a ghost button, with no word beside it", () => {
        const html = renderToString(<PullToRefreshIndicator state="pulling" onReload={reload} />);

        expect(html).toContain("twui-button-secondary-ghost");
        expect(html).toContain(`aria-label="Reload the conversation"`);
        expect(html).toContain("<svg");
        /**
         * Nothing but the icon: the button's content wrapper holds no text.
         */
        expect(html).not.toMatch(/twui-button-content-wrapper[^>]*>[A-Za-z]/);
    });

    test("dims the icon while it's only being pulled and lights it up once letting go reloads", () => {
        expect(
            renderToString(<PullToRefreshIndicator state="pulling" onReload={reload} />),
        ).toContain("opacity-40");
        expect(
            renderToString(<PullToRefreshIndicator state="ready" onReload={reload} />),
        ).not.toContain("opacity-40");
    });

    test("holds the icon's place with a spinner while it reloads", () => {
        const html = renderToString(
            <PullToRefreshIndicator state="refreshing" onReload={reload} />,
        );

        expect(html).toContain("twui-loading");
        expect(html).toContain("aria-busy");
        expect(html).toContain("disabled");
    });
});