import { describe, expect, test } from "bun:test";
import planModeKey from "./plan-mode-key";

describe("planModeKey", () => {
    test("names the bot and the workspace it is in", () => {
        expect(planModeKey({ bot_id: 3, workspace_id: 7 })).toBe("3:7");
    });

    test("a bot's own chat and its workspace are different places", () => {
        expect(planModeKey({ bot_id: 3 })).not.toBe(planModeKey({ bot_id: 3, workspace_id: 7 }));
    });

    test("nothing stored reads the same as nothing asked for", () => {
        expect(planModeKey({})).toBe("0:0");
        expect(planModeKey({ bot_id: null, workspace_id: null })).toBe("0:0");
    });
});