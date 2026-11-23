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

function render() {
    return renderToString(
        <AppContext.Provider value={{ pageProps } as AppContextObject}>
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
});