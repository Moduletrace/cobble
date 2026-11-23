import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type {
    AppContextObject,
    BotWithLastMessage,
    PagePropsType,
} from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import BotPanelTrigger from "./bot-panel-trigger";

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
 * The stone is the same either way; only a crew manager's opens the bot's
 * panel, whether it sits in the header or beside a message.
 */
function render({ user_type, name = "Assistant" }: RenderProps) {
    const pageProps: PagePropsType = {
        url: { pathname: "/admin/bots/5" } as PagePropsType["url"],
        user_types: [{ user_type }] as PagePropsType["user_types"],
    };

    return renderToString(
        <AppContext.Provider value={{ pageProps } as AppContextObject}>
            <BotPanelTrigger bot={bot({ name })} size={28} />
        </AppContext.Provider>,
    );
}

describe("BotPanelTrigger", () => {
    test("a member sees the stone alone", () => {
        const html = render({ user_type: "member" });

        expect(html).toContain("<svg");
        expect(html).not.toContain("<button");
        expect(html).not.toContain('aria-haspopup="dialog"');
    });

    test("a crew manager's stone is a button that opens the panel", () => {
        const html = render({ user_type: "super_admin" });

        expect(html).toContain("<button");
        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain('aria-label="Edit Assistant"');
    });

    test("an unnamed bot is called this bot in the button's label", () => {
        const html = render({ user_type: "admin", name: "" });

        expect(html).toContain('aria-label="Edit This bot"');
    });
});