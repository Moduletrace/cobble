import { describe, expect, test } from "bun:test";
import type { HarnessMessage } from "../types";
import pushUserTurn from "./push-user-turn";

describe("pushUserTurn", () => {
    test("adds a turn after the bot's", () => {
        const transcript: HarnessMessage[] = [{ role: "assistant", content: "Hi." }];

        pushUserTurn({ transcript, content: "Hello" });

        expect(transcript).toEqual([
            { role: "assistant", content: "Hi." },
            { role: "user", content: "Hello" },
        ]);
    });

    test("joins text onto a user turn, so roles never repeat", () => {
        const transcript: HarnessMessage[] = [{ role: "user", content: "One" }];

        pushUserTurn({ transcript, content: "Two" });

        expect(transcript).toEqual([{ role: "user", content: "One\n\nTwo" }]);
    });

    test("joins parts once either side has files", () => {
        const transcript: HarnessMessage[] = [{ role: "user", content: "Look" }];

        pushUserTurn({ transcript, content: [{ type: "image", url: "u" }] });

        expect(transcript).toEqual([
            {
                role: "user",
                content: [
                    { type: "text", text: "Look" },
                    { type: "image", url: "u" },
                ],
            },
        ]);
    });
});
