import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { BotComputersContext } from "../(data)/bot-computers-context";
import { LastUserMessageContext, MessageIdContext } from "../(data)/message-answer-context";
import TakeOverCard from "./take-over-card";

type RenderProps = {
    message_id: number | null;
    last_user_id: number | null;
};

const computers = {
    computers: [{ id: 1, name: "Main computer" } as BUN_SQLITE_COBBLE_COMPUTERS],
    switchComputer: async () => {},
    openComputer: () => {},
    closeComputer: () => {},
};

function render({ message_id, last_user_id }: RenderProps) {
    return renderToString(
        <BotComputersContext.Provider value={computers}>
            <LastUserMessageContext.Provider value={last_user_id}>
                <MessageIdContext.Provider value={message_id}>
                    <TakeOverCard computer_id={1} mode="browser" />
                </MessageIdContext.Provider>
            </LastUserMessageContext.Provider>
        </BotComputersContext.Provider>,
    );
}

describe("TakeOverCard", () => {
    test("waits while no user message follows the ask", () => {
        const html = render({ message_id: 10, last_user_id: 5 });

        expect(html).toContain("Waiting for you");
    });

    test("stops waiting once the user has written after it", () => {
        const html = render({ message_id: 10, last_user_id: 12 });

        expect(html).not.toContain("Waiting for you");
        expect(html).toContain("Browser");
    });

    test("claims nothing outside a thread", () => {
        expect(render({ message_id: null, last_user_id: null })).not.toContain("Waiting for you");
    });
});