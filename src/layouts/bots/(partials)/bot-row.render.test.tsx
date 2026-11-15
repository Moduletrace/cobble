import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BotWithLastMessage } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";
import BotRow from "./bot-row";

function bot(overrides: Partial<BotWithLastMessage>): BotWithLastMessage {
    return {
        id: 1,
        name: "Ember",
        color: "#c2410c",
        stone: "ember",
        face: "idle",
        ...overrides,
    } as BotWithLastMessage;
}

const three_hours_ago = Date.now() - 3 * 60 * 60 * 1000;

/**
 * The rail row's right column: time normally, the bot's spinner while it has
 * work running. The face is the user's, so it covers work elsewhere, and the
 * time comes back once the work ends.
 */
describe("BotRow", () => {
    test("a working bot shows the spinner instead of the time", () => {
        const html = renderToString(
            <BotRow bot={bot({ face: "working", last_message_at: three_hours_ago })} />,
        );

        expect(html).toContain('aria-label="Working"');
        expect(html).not.toContain(`>${relativeTime({ at: three_hours_ago })}<`);
    });

    test("the spinner keeps the bot's colour", () => {
        const html = renderToString(<BotRow bot={bot({ face: "working", color: "#16a394" })} />);

        expect(html).toContain('stroke="#16a394"');
    });

    test("the coordinator has no colour, so its spinner takes the row's ink", () => {
        const html = renderToString(<BotRow bot={bot({ face: "working", color: undefined })} />);

        expect(html).toContain('stroke="currentColor"');
    });

    test("an idle bot keeps the time and shows no spinner", () => {
        const html = renderToString(
            <BotRow bot={bot({ face: "idle", last_message_at: three_hours_ago })} />,
        );

        expect(html).not.toContain('aria-label="Working"');
        expect(html).toContain(`>${relativeTime({ at: three_hours_ago })}<`);
    });

    test("a working bot keeps its unread marker: the spinner takes the time's slot alone", () => {
        const html = renderToString(
            <BotRow bot={bot({ face: "working", unread: 2, last_message_at: three_hours_ago })} />,
        );

        expect(html).toContain('aria-label="Working"');
        expect(html).toContain('aria-label="Unread"');
    });

    test("a bot that never spoke shows neither a spinner nor a time while it rests", () => {
        const html = renderToString(<BotRow bot={bot({ face: "idle" })} />);

        expect(html).not.toContain('aria-label="Working"');
        expect(html).toContain("Ember");
    });

    test("a working bot with no conversation yet still spins", () => {
        const html = renderToString(<BotRow bot={bot({ face: "working" })} />);

        expect(html).toContain('aria-label="Working"');
    });
});