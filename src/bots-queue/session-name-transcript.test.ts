import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import sessionNameTranscript from "./session-name-transcript";

describe("sessionNameTranscript", () => {
    test("reads the exchange as the user's and the bot's", () => {
        expect(
            sessionNameTranscript({
                messages: [
                    { id: 1, author: "user", text: "Create a bot" },
                    { id: 2, author: "bot", text: "Done." },
                ],
            }),
        ).toBe("User: Create a bot\n\nYou: Done.");
    });

    test("marks a carried summary as the earlier session's, not the bot's words", () => {
        const transcript = sessionNameTranscript({
            messages: [
                { id: 1, author: "bot", text: "- Crew set up", carried_from_session_id: 9 },
                { id: 2, author: "user", text: "Continue here" },
            ],
        });

        expect(transcript).toStartWith("(Summary of the earlier session this one carries on from)\n- Crew set up");
        expect(transcript).not.toContain("You: - Crew set up");
    });

    test("names a session once as the opening pasted whole", () => {
        const brief = "a".repeat(AppData.BotSessionNameMessageChars);

        expect(sessionNameTranscript({ messages: [{ id: 1, author: "user", text: brief }] })).toBe(`User: ${brief}`);
    });

    test("cuts a pasted brief to its opening, and says it goes on", () => {
        const brief = "x".repeat(30_000);

        const transcript = sessionNameTranscript({ messages: [{ id: 1, author: "user", text: brief }] });

        expect(transcript).toStartWith(`User: ${brief.slice(0, AppData.BotSessionNameMessageChars)}...`);
        expect(transcript).toContain("the opening continues");
        expect(transcript).toContain("30,000 characters in all");
        expect(transcript.length).toBeLessThan(AppData.BotSessionNameMessageChars + 200);
    });

    test("says a message carried only files", () => {
        expect(sessionNameTranscript({ messages: [{ id: 1, author: "user", text: "" }] })).toBe("User: (files only)");
    });
});
