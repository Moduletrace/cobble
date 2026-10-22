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

describe("botMessagesToHarness with replies", () => {
    test("quotes what a user message answers", () => {
        expect(
            botMessagesToHarness({
                messages: [
                    { author: "user", text: "hi" },
                    { author: "bot", text: "The report is ready." },
                    {
                        author: "user",
                        text: "Great, send it over.",
                        reply_to: { id: 4, author: "bot", text: "The report is ready." },
                    },
                ],
            }),
        ).toEqual([
            { role: "user", content: "hi" },
            { role: "assistant", content: "The report is ready." },
            {
                role: "user",
                content: `[Replying to your earlier message: "The report is ready."]\n\nGreat, send it over.`,
            },
        ]);
    });

    test("says a quoted file-only message was a file", () => {
        expect(
            botMessagesToHarness({
                messages: [
                    {
                        author: "user",
                        text: "What was that?",
                        reply_to: { id: 5, author: "user", text: "" },
                    },
                ],
            }),
        ).toEqual([
            {
                role: "user",
                content: `[Replying to the user's own earlier message: "(a file)"]\n\nWhat was that?`,
            },
        ]);
    });
});

describe("botMessagesToHarness with a file-only reply", () => {
    test("keeps the quote when the reply has no text", () => {
        expect(
            botMessagesToHarness({
                messages: [
                    {
                        id: 7,
                        author: "user",
                        text: "",
                        reply_to: { id: 4, author: "bot", text: "Send me the logo." },
                        attachments: [{ id: 9, name: "logo.png", media_type: "image", url: "/media/9" }],
                    },
                ],
            }),
        ).toEqual([
            {
                role: "user",
                content: `[Replying to your earlier message: "Send me the logo."]\n\n[Attached earlier: "logo.png"]`,
            },
        ]);
    });
});

describe("botMessagesToHarness with files", () => {
    const attachments = [{ id: 9, name: "shot.png", media_type: "image" as const, url: "/media/9" }];

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

describe("botMessagesToHarness with mentions", () => {
    test("names the bots and workspaces a user message mentions", () => {
        expect(
            botMessagesToHarness({
                messages: [message("user", "ask [bot:3]"), message("bot", "[bot:3] is on it")],
                refs: { bots: new Map([[3, { name: "Ada" }]]), workspaces: new Map() },
            }),
        ).toEqual([
            { role: "user", content: "ask [bot:3]\n\n[Mentions: [bot:3] is Ada]" },
            { role: "assistant", content: "[bot:3] is on it" },
        ]);
    });
});
