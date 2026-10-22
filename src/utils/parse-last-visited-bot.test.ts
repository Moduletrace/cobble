import { describe, expect, test } from "bun:test";
import parseLastVisitedBot from "./parse-last-visited-bot";

describe("parseLastVisitedBot", () => {
    test("a bot's own chat", () => {
        expect(parseLastVisitedBot({ bot_id: "3" })).toEqual({ bot_id: 3, workspace_id: null });
        expect(parseLastVisitedBot({ bot_id: 3, workspace_id: "" })).toEqual({
            bot_id: 3,
            workspace_id: null,
        });
        expect(parseLastVisitedBot({ bot_id: 3, workspace_id: null })).toEqual({
            bot_id: 3,
            workspace_id: null,
        });
    });

    test("a workspace conversation", () => {
        expect(parseLastVisitedBot({ bot_id: "3", workspace_id: "7" })).toEqual({
            bot_id: 3,
            workspace_id: 7,
        });
    });

    test("rejects ids that aren't positive whole numbers", () => {
        expect(parseLastVisitedBot({})).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "0" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "-1" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "1.5" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "abc" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "1 OR 1=1" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "99999999999999999999" })).toBeNull();
    });

    test("a bad workspace falls back to nothing, never to its own chat", () => {
        expect(parseLastVisitedBot({ bot_id: "3", workspace_id: "abc" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "3", workspace_id: "0" })).toBeNull();
    });

    test("trims what a cookie header may carry", () => {
        expect(parseLastVisitedBot({ bot_id: " 3 ", workspace_id: " 7 " })).toEqual({
            bot_id: 3,
            workspace_id: 7,
        });
    });
});
