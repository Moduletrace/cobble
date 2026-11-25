import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type {
    AppContextObject,
    BotWithLastMessage,
    PagePropsType,
} from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import BotPanelName from "./bot-panel-name";

function bot(overrides: Partial<BotWithLastMessage> = {}): BotWithLastMessage {
    return {
        id: 5,
        name: "Assistant",
        color: "#33c9cc",
        stone: "ember",
        face: "idle",
        ...overrides,
    } as BotWithLastMessage;
}

type RenderProps = {
    user_type: string;
    name?: string;
};

/**
 * The name is the header's heading either way, and a button that opens the
 * bot's panel for everyone who reaches it, labelled by what they may do
 * there.
 */
function render({ user_type, name = "Assistant" }: RenderProps) {
    const pageProps: PagePropsType = {
        url: { pathname: "/admin/bots/5" } as PagePropsType["url"],
        user_types: [{ user_type }] as PagePropsType["user_types"],
    };

    return renderToString(
        <AppContext.Provider value={{ pageProps } as AppContextObject}>
            <BotPanelName bot={bot({ name })} on_open={() => {}} />
        </AppContext.Provider>,
    );
}

describe("BotPanelName", () => {
    test("a member's name opens the panel too, to read", () => {
        const html = render({ user_type: "member" });

        expect(html).toContain("<h1");
        expect(html).toContain(">Assistant<");
        expect(html).toContain("<button");
        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain('aria-label="About Assistant"');
    });

    test("a crew manager's name is a button that opens the panel", () => {
        const html = render({ user_type: "super_admin" });

        expect(html).toContain("<h1");
        expect(html).toContain("<button");
        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain('aria-label="Edit Assistant"');
    });

    test("the name itself still shows, so the heading reads right", () => {
        const html = render({ user_type: "admin", name: "Software Engineer" });

        expect(html).toContain(">Software Engineer<");
        expect(html).toContain('aria-label="Edit Software Engineer"');
    });

    test("an unnamed bot is called this bot in the button's label", () => {
        const html = render({ user_type: "super_admin", name: "" });

        expect(html).toContain('aria-label="Edit This bot"');
    });
});