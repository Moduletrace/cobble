import { describe, expect, test } from "bun:test";
import type { BotMessageWithAttachments } from "@/src/types";
import threadMessages from "./thread-messages";

const messages = [
    { id: 1, author: "user" as const, text: "a", created_at: 0 },
    { id: 2, author: "bot" as const, text: "Stopped.", created_at: 1000 },
];

describe("threadMessages", () => {
    test("shows every message when nothing is being run again", () => {
        expect(threadMessages({ messages })).toEqual(messages);
        expect(threadMessages({ messages, rerun_message_id: null })).toEqual(
            messages,
        );
    });

    test("leaves the message being run again out while that run works", () => {
        expect(threadMessages({ messages, rerun_message_id: 2 })).toEqual([
            messages[0]!,
        ]);
    });

    test("the user's own message asked again stays in the thread", () => {
        expect(threadMessages({ messages, rerun_message_id: 1 })).toEqual(
            messages,
        );
    });

    test("leaves the rest of the thread alone", () => {
        const shown = threadMessages({ messages, rerun_message_id: 2 });

        expect(shown).toHaveLength(1);
        expect(messages).toHaveLength(2);
    });

    test("matches the message by its id as the server sends it", () => {
        const rows: BotMessageWithAttachments[] = [
            { ...messages[0]!, id: "" },
            { ...messages[1]!, id: 2 },
        ];

        expect(threadMessages({ messages: rows, rerun_message_id: 2 })).toEqual([
            rows[0]!,
        ]);
    });
});