import { describe, expect, test } from "bun:test";
import askPreviousSessionId from "./ask-previous-session-id";

describe("askPreviousSessionId", () => {
    test("a session the bot was in before the request is the way back", () => {
        expect(askPreviousSessionId({ previous_session_id: 12, session_id: 15 })).toBe(12);
    });

    test("a bot with no session before the request has nothing to go back to", () => {
        expect(askPreviousSessionId({ previous_session_id: null, session_id: 15 })).toBeNull();
        expect(askPreviousSessionId({ session_id: 15 })).toBeNull();
        expect(askPreviousSessionId({ previous_session_id: 0, session_id: 15 })).toBeNull();
    });

    test("the request's own session is never its previous one", () => {
        expect(askPreviousSessionId({ previous_session_id: 15, session_id: 15 })).toBeNull();
    });

    test("ids arriving as text are read as numbers", () => {
        expect(askPreviousSessionId({ previous_session_id: "12", session_id: "15" })).toBe(12);
        expect(askPreviousSessionId({ previous_session_id: "15", session_id: "15" })).toBeNull();
        expect(askPreviousSessionId({ previous_session_id: "", session_id: "15" })).toBeNull();
    });

    test("no session on screen leaves nothing to lead back to", () => {
        expect(askPreviousSessionId({ previous_session_id: 12, session_id: null })).toBe(12);
        expect(askPreviousSessionId({ previous_session_id: null, session_id: null })).toBeNull();
    });
});