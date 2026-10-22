import { describe, expect, test } from "bun:test";
import type { BotMessageWithAttachments } from "@/src/types";
import copyableMessages from "./copyable-messages";

function message(text?: string): BotMessageWithAttachments {
    return { id: 1, author: "user", text } as BotMessageWithAttachments;
}

describe("copyableMessages", () => {
    test("keeps the messages that have text", () => {
        const kept = copyableMessages({
            messages: [message("hello"), message(undefined), message("hi")],
        });

        expect(kept.map((one) => one.text)).toEqual(["hello", "hi"]);
    });

    test("drops text that is only whitespace", () => {
        expect(copyableMessages({ messages: [message("   ")] })).toEqual([]);
    });

    test("a group with no text has nothing to copy", () => {
        expect(copyableMessages({ messages: [message(), message()] })).toEqual(
            [],
        );
    });
});
