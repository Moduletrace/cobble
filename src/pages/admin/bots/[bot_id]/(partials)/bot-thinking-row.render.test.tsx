import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import type { BotWithLastMessage } from "@/src/types";
import BotThinkingRow from "./bot-thinking-row";

function bot(overrides: Partial<BotWithLastMessage>): BotWithLastMessage {
    return {
        id: 1,
        name: "Ember",
        color: "#c2410c",
        stone: "ember",
        face: "working",
        ...overrides,
    } as BotWithLastMessage;
}

/**
 * The row under the thread: its label, and the step of the work it shows.
 * The reply's step is the one a reload has to bring back, or the row sits
 * on its label until the run's next push.
 */
describe("BotThinkingRow", () => {
    test("a reply owed here shows the step it's on", () => {
        const html = renderToString(
            <BotThinkingRow bot={bot({})} awaiting_reply reply_progress="Reading the invoice" />,
        );

        expect(html).toContain("Ember is thinking");
        expect(html).toContain("Reading the invoice");
    });

    test("a task shows the step it's on", () => {
        const html = renderToString(
            <BotThinkingRow
                bot={bot({ status_line: "Working on a task" })}
                has_task
                progress="Using sandbox_execute_bash"
            />,
        );

        expect(html).toContain("Ember is working");
        expect(html).toContain("Using sandbox_execute_bash");
    });

    test("no step yet shows the label alone", () => {
        const html = renderToString(<BotThinkingRow bot={bot({})} awaiting_reply />);

        expect(html).toContain("Ember is thinking");
        expect(html).not.toContain("Reading the invoice");
    });
});