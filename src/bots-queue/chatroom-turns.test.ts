import { describe, expect, test } from "bun:test";
import chatroomTurns from "./chatroom-turns";

const names = new Map([
    [1, "Coordinator"],
    [3, "Ada"],
    [5, "Ben"],
]);

describe("chatroomTurns", () => {
    test("the coordinator's messages are its own turns; every other bot's is fenced data", () => {
        const turns = chatroomTurns({
            messages: [
                { bot_id: 3, text: "**Specs**\n\nI need the API specs." },
                { bot_id: 1, text: "Asking Ben." },
                { bot_id: 5, text: "Here they are." },
            ],
            coordinator_id: 1,
            requester_id: 3,
            names,
        });

        expect(turns.map((turn) => turn.role)).toEqual(["user", "assistant", "user"]);
        expect(turns[0]?.content).toContain("[From Ada (bot 3), who asked, passed on by the app.");
        expect(turns[1]?.content).toBe("Asking Ben.");
        expect(turns[2]?.content).toContain("[From Ben (bot 5), passed on by the app.");
        expect(turns[2]?.content).toContain("```\nHere they are.\n```");
    });

    test("neighbouring turns from one side are joined and the room starts with the request", () => {
        const turns = chatroomTurns({
            messages: [
                { bot_id: 1, text: "Stray note." },
                { bot_id: 3, text: "Request." },
                { bot_id: 5, text: "Answer." },
                { bot_id: 1, text: "" },
            ],
            coordinator_id: 1,
            requester_id: 3,
            names,
        });

        expect(turns).toHaveLength(1);
        expect(turns[0]?.role).toBe("user");
        expect(String(turns[0]?.content)).toContain("Request.");
        expect(String(turns[0]?.content)).toContain("Answer.");
    });
});
