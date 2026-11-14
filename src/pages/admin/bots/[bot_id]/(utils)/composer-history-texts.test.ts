import { describe, expect, test } from "bun:test";
import composerHistoryTexts from "./composer-history-texts";

const sent = (text: string) => ({ author: "user" as const, text });
const answered = (text: string) => ({ author: "bot" as const, text });

describe("composerHistoryTexts", () => {
    test("keeps what the user typed, oldest first", () => {
        const texts = composerHistoryTexts({
            messages: [
                sent("plan the migration"),
                answered("Here's the plan"),
                sent("ship it tonight"),
            ],
        });

        expect(texts).toEqual(["plan the migration", "ship it tonight"]);
    });

    test("leaves out the bot's answers and blank messages", () => {
        const texts = composerHistoryTexts({
            messages: [answered("Morning"), sent("   "), sent(""), sent("real text")],
        });

        expect(texts).toEqual(["real text"]);
    });

    test("leaves out what a crew request or an install request wrote on the user's side", () => {
        const texts = composerHistoryTexts({
            messages: [
                sent("ask the crew"),
                { author: "user" as const, text: "Request ended: the answer", from_ask_id: 12 },
                { author: "user" as const, text: "Installed numpy", from_install_request_id: 3 },
            ],
        });

        expect(texts).toEqual(["ask the crew"]);
    });

    test("trims a message's text around it", () => {
        const texts = composerHistoryTexts({ messages: [sent("  keep this  ")] });

        expect(texts).toEqual(["keep this"]);
    });

    test("is empty for a session with nothing sent yet", () => {
        expect(composerHistoryTexts({ messages: [answered("Hello")] })).toEqual([]);
    });
});