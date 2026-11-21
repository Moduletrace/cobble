import { describe, expect, test } from "bun:test";
import requestBotPanel, { BotPanelOpenEvent } from "./bot-panel-open-event";

describe("requestBotPanel", () => {
    test("announces that the panel should open", () => {
        const target = new EventTarget();
        let heard = 0;

        target.addEventListener(BotPanelOpenEvent, () => {
            heard += 1;
        });
        requestBotPanel({ target });

        expect(heard).toBe(1);
        expect(BotPanelOpenEvent).toBe("cobble:open-bot-panel");
    });

    test("says nothing to a target that isn't there", () => {
        expect(() => requestBotPanel({ target: null })).not.toThrow();
    });
});