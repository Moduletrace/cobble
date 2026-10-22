import { describe, expect, test } from "bun:test";
import parseLastVisitedBot from "./parse-last-visited-bot";

describe("parseLastVisitedBot", () => {
    test("a bot id becomes the bot", () => {
        expect(parseLastVisitedBot({ bot_id: "3" })).toEqual({ bot_id: 3 });
        expect(parseLastVisitedBot({ bot_id: 3 })).toEqual({ bot_id: 3 });
    });

    test("rejects ids that aren't positive whole numbers", () => {
        expect(parseLastVisitedBot({})).toBeNull();
        expect(parseLastVisitedBot({ bot_id: null })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "0" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "-1" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "1.5" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "abc" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "1 OR 1=1" })).toBeNull();
        expect(parseLastVisitedBot({ bot_id: "99999999999999999999" })).toBeNull();
    });

    test("trims what a cookie header may carry", () => {
        expect(parseLastVisitedBot({ bot_id: " 3 " })).toEqual({ bot_id: 3 });
    });
});
