import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import askOutcomeMessage from "./ask-outcome-message";

const ask = {
    id: 3,
    title: "Cite the sheet",
    target_bot_id: 12,
    gate_note: "Not something the crew does.",
} as BUN_SQLITE_COBBLE_BOT_ASKS;

describe("askOutcomeMessage", () => {
    test("a refusal carries the gate's reason", () => {
        expect(askOutcomeMessage({ ask, status: "refused" })).toBe(
            'The coordinator turned down "Cite the sheet" [ask:3]:\n\nNot something the crew does.',
        );
    });

    test("an answer carries the bot it came from and what it said", () => {
        const text = askOutcomeMessage({ ask, status: "answered", outcome: "Here is the sheet." });

        expect(text).toContain('"Cite the sheet"');
        expect(text).toContain("[ask:3]");
        expect(text).toContain("[bot:12]");
        expect(text).toContain("Here is the sheet.");
    });

    test("a failure says why", () => {
        expect(askOutcomeMessage({ ask, status: "failed", outcome: "It ran out of steps." })).toContain(
            "It ran out of steps.",
        );
    });

    test("a stop says the user stopped it", () => {
        expect(askOutcomeMessage({ ask, status: "stopped" })).toContain("the user stopped it, so there is no answer");
    });

    test("a stop carries the reason it was stopped for", () => {
        const text = askOutcomeMessage({
            ask,
            status: "stopped",
            outcome: "The user stopped the run answering it, so there is no answer.",
        });

        expect(text).toContain("The coordinator stopped \"Cite the sheet\"");
        expect(text).toContain("The user stopped the run answering it");
    });

    test("names an unnamed request without empty quotes", () => {
        expect(askOutcomeMessage({ ask: { ...ask, title: "" }, status: "refused" })).toContain("your crew request");
    });
});
