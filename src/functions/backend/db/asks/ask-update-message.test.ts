import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import askUpdateMessage from "./ask-update-message";

/**
 * A result that comes back while a crew request is still open: it names the
 * request and the bot that sent it, carries the result, and says plainly
 * that more may follow so the asking bot doesn't treat it as the whole
 * answer.
 */
const ask = { id: 3, title: "Build the preapproval graphic", target_bot_id: 3 } as BUN_SQLITE_COBBLE_BOT_ASKS;

describe("askUpdateMessage", () => {
    test("names the bot, the request and the result, and says more may follow", () => {
        const text = askUpdateMessage({ ask, text: "The first pass is saved: [file:650]." });

        expect(text).toContain("[bot:3] sent a response on");
        expect(text).toContain(`"Build the preapproval graphic"`);
        expect(text).toContain("[ask:3]");
        expect(text).toContain("The first pass is saved: [file:650].");
        expect(text).toContain("The request is still open - more may follow.");
    });

    test("a failed piece says so", () => {
        const text = askUpdateMessage({ ask, text: "The render crashed.", failed: true });

        expect(text).toContain("couldn't finish one piece of");
        expect(text).toContain("The render crashed.");
        expect(text).toContain("still open");
    });

    test("a request with no title still reads", () => {
        const text = askUpdateMessage({ ask: { id: 3, target_bot_id: 3 } as BUN_SQLITE_COBBLE_BOT_ASKS, text: "Done." });

        expect(text).toContain("your crew request");
    });
});
