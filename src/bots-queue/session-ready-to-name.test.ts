import { describe, expect, test } from "bun:test";
import sessionReadyToName from "./session-ready-to-name";

describe("sessionReadyToName", () => {
    test("waits for the bot to answer the user", () => {
        expect(sessionReadyToName({ messages: [{ id: 1, author: "user", text: "Hi" }] })).toBe(false);
    });

    test("names a first exchange", () => {
        expect(
            sessionReadyToName({
                messages: [
                    { id: 1, author: "user", text: "Hi" },
                    { id: 2, author: "bot", text: "Hello" },
                ],
            }),
        ).toBe(true);
    });

    test("names work handed to the bot, with no user message", () => {
        expect(
            sessionReadyToName({
                messages: [{ id: 1, author: "bot", text: "Coordinator asked me to: **SEO lookup**" }],
            }),
        ).toBe(true);
    });

    test("a carried summary alone is not the bot's answer", () => {
        expect(
            sessionReadyToName({
                messages: [
                    { id: 1, author: "bot", text: "- Crew set up", carried_from_session_id: 9 },
                    { id: 2, author: "user", text: "Continue here" },
                ],
            }),
        ).toBe(false);
        expect(
            sessionReadyToName({
                messages: [{ id: 1, author: "bot", text: "- Crew set up", carried_from_session_id: 9 }],
            }),
        ).toBe(false);
    });
});
