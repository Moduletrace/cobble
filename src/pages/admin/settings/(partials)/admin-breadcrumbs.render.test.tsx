import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { AppContextObject, PagePropsType } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import SettingsShell from "./settings-shell";

type RenderProps = {
    pathname: string;
    /**
     * The page's own title, the name the header shows.
     */
    title: string;
};

function render({ pathname, title }: RenderProps) {
    const pageProps: PagePropsType = {
        url: { pathname } as PagePropsType["url"],
    };
    const context = { pageProps } as AppContextObject;

    return renderToString(
        <AppContext.Provider value={context}>
            <SettingsShell
                title={title}
                description="Work your bots do on a schedule."
            >
                <span>PAGE_CONTENT</span>
            </SettingsShell>
        </AppContext.Provider>,
    );
}

describe("SettingsShell breadcrumbs", () => {
    test("a top-level page shows Home and itself", () => {
        const html = render({ pathname: "/admin/routines", title: "Routines" });

        expect(html).toContain('aria-label="Breadcrumb"');
        expect(html).toContain(">Home<");
        expect(html).toContain(">Routines<");
        expect(html).toContain('href="/admin/routines"');
    });

    test("a settings page walks through Settings up to the page", () => {
        const html = render({
            pathname: "/admin/settings/general",
            title: "General",
        });

        expect(html).toContain('href="/admin"');
        expect(html).toContain('href="/admin/settings"');
        expect(html).toContain('href="/admin/settings/general"');
    });

    test("a record page reads its name, not the id in its address", () => {
        const html = render({
            pathname: "/admin/settings/bots/3",
            title: "Scout",
        });

        expect(html).toContain(">Scout<");
        expect(html).not.toContain(">3<");
    });

    test("a page whose slug differs from its name shows the name", () => {
        const html = render({
            pathname: "/admin/settings/change-password",
            title: "Change password",
        });

        expect(html).toContain(">Change password<");
        expect(html).not.toContain(">Change Password<");
    });

    test("Activity keeps its name though its address says logs", () => {
        const html = render({ pathname: "/admin/logs", title: "Activity" });

        expect(html).toContain(">Activity<");
        expect(html).not.toContain(">Logs<");
    });

    test("the trail sits above the page's content, right after the header", () => {
        const html = render({ pathname: "/admin/routines", title: "Routines" });

        expect(html.indexOf('aria-label="Breadcrumb"')).toBeLessThan(
            html.indexOf("PAGE_CONTENT"),
        );
    });

    test("the crew of bots, which is home, has no trail above it", () => {
        const html = render({ pathname: "/admin/bots", title: "Bots" });

        expect(html).not.toContain('aria-label="Breadcrumb"');
    });
});
