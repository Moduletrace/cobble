import { describe, expect, test } from "bun:test";
import botMessagesToHarness from "./bot-messages-to-harness";

const message = (author: "user" | "bot", text: string) => ({ author, text });

describe("botMessagesToHarness", () => {
    test("maps authors to roles", () => {
        expect(
            botMessagesToHarness({
                messages: [message("user", "hi"), message("bot", "hello")],
            }),
        ).toEqual([
            { role: "user", content: "hi" },
            { role: "assistant", content: "hello" },
        ]);
    });

    test("joins back-to-back messages from one side", () => {
        expect(
            botMessagesToHarness({
                messages: [message("user", "one"), message("user", "two")],
            }),
        ).toEqual([{ role: "user", content: "one\n\ntwo" }]);
    });

    test("starts with the user and skips empty messages", () => {
        expect(
            botMessagesToHarness({
                messages: [
                    message("bot", "welcome"),
                    message("user", " "),
                    message("user", "hi"),
                ],
            }),
        ).toEqual([{ role: "user", content: "hi" }]);
    });
});

describe("botMessagesToHarness with files", () => {
    const attachments = [{ id: 9, name: "shot.png", media_type: "image" as const, url: "/media/private/9" }];

    test("puts a message's loaded files after its text", () => {
        const parts = new Map([[1, [{ type: "image" as const, url: "data:image/jpeg;base64,AA", name: "shot.png" }]]]);

        expect(
            botMessagesToHarness({
                messages: [{ id: 1, author: "user", text: "What's this?", attachments }],
                parts,
            }),
        ).toEqual([
            {
                role: "user",
                content: [
                    { type: "text", text: "What's this?" },
                    { type: "image", url: "data:image/jpeg;base64,AA", name: "shot.png" },
                ],
            },
        ]);
    });

    test("names files it didn't load, and keeps a file-only message", () => {
        expect(
            botMessagesToHarness({
                messages: [{ id: 2, author: "user", text: "", attachments }],
            }),
        ).toEqual([{ role: "user", content: `[Attached earlier: "shot.png"]` }]);
    });
});
