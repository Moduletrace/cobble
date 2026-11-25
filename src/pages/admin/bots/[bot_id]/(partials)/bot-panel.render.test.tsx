import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type {
    AppContextObject,
    BotWithLastMessage,
    PagePropsType,
} from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import BotPanel from "./bot-panel";

const bot = {
    id: 5,
    name: "Assistant",
    color: "#33c9cc",
    stone: "ember",
    face: "idle",
    kind: "worker",
} as BotWithLastMessage;

const pageProps: PagePropsType = {
    url: { pathname: "/admin/bots/5" } as PagePropsType["url"],
    user_types: [{ user_type: "super_admin" }] as PagePropsType["user_types"],
};

const memberPageProps: PagePropsType = {
    ...pageProps,
    user_types: [{ user_type: "member" }] as PagePropsType["user_types"],
};

function render(props: PagePropsType = pageProps) {
    return renderToString(
        <AppContext.Provider value={{ pageProps: props } as AppContextObject}>
            <BotPanel
                bot={bot}
                open={false}
                on_open={() => {}}
                on_close={() => {}}
            />
        </AppContext.Provider>,
    );
}

describe("BotPanel", () => {
    /**
     * Memory is edited under Settings: on its own it was one short editor in
     * a tab of its own.
     */
    test("its memory sits in Settings, so it has two tabs", () => {
        const html = render();

        expect(html.match(/role="tab"/g)?.length).toBe(2);
        expect(html).toContain(">Settings<");
        expect(html).toContain(">Tools<");
        expect(html).not.toContain(">Memory<");
    });

    /**
     * A member reads the bot and rewrites what it remembers about them, so
     * the stone still opens the panel, under a title that doesn't promise
     * edits they can't make.
     */
    test("a member reads it, without the edit it alone can't make", () => {
        const html = render(memberPageProps);

        expect(html.match(/role="tab"/g)?.length).toBe(2);
        expect(html).toContain(`aria-label="About Assistant"`);
        expect(html).not.toContain("Edit Assistant");
    });
});