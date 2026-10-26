import { describe, expect, test } from "bun:test";
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
});
