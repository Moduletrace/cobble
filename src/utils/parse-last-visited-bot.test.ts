import { describe, expect, test } from "bun:test";
import parseLastVisitedBot from "./parse-last-visited-bot";

describe("parseLastVisitedBot", () => {
    test("a bot id becomes the bot's own chat", () => {
        expect(parseLastVisitedBot({ value: "3" })).toEqual({ bot_id: 3, workspace_id: null });
        expect(parseLastVisitedBot({ value: 3 })).toEqual({ bot_id: 3, workspace_id: null });
    });

    test("a bot and workspace become the workspace conversation", () => {
        expect(parseLastVisitedBot({ value: "3:7" })).toEqual({ bot_id: 3, workspace_id: 7 });
    });

    test("a bad workspace part keeps only the bot", () => {
        expect(parseLastVisitedBot({ value: "3:" })).toEqual({ bot_id: 3, workspace_id: null });
        expect(parseLastVisitedBot({ value: "3:0" })).toEqual({ bot_id: 3, workspace_id: null });
        expect(parseLastVisitedBot({ value: "3:abc" })).toEqual({ bot_id: 3, workspace_id: null });
    });

    test("rejects ids that aren't positive whole numbers", () => {
        expect(parseLastVisitedBot({})).toBeNull();
        expect(parseLastVisitedBot({ value: null })).toBeNull();
        expect(parseLastVisitedBot({ value: "" })).toBeNull();
        expect(parseLastVisitedBot({ value: "0" })).toBeNull();
        expect(parseLastVisitedBot({ value: "-1" })).toBeNull();
        expect(parseLastVisitedBot({ value: "1.5" })).toBeNull();
        expect(parseLastVisitedBot({ value: "abc" })).toBeNull();
        expect(parseLastVisitedBot({ value: "1 OR 1=1" })).toBeNull();
        expect(parseLastVisitedBot({ value: "99999999999999999999" })).toBeNull();
        expect(parseLastVisitedBot({ value: ":7" })).toBeNull();
        expect(parseLastVisitedBot({ value: "3:7:9" })).toBeNull();
    });

    test("trims what a cookie header may carry", () => {
        expect(parseLastVisitedBot({ value: " 3 " })).toEqual({ bot_id: 3, workspace_id: null });
    });
});
