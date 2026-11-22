import { describe, expect, test } from "bun:test";
import sidePanelCloseSwipe from "./side-panel-close-swipe";

describe("sidePanelCloseSwipe", () => {
    test("a panel from the left closes on a swipe back to the left", () => {
        expect(sidePanelCloseSwipe({ side: "left" })).toBe("left");
    });

    test("a panel from the right closes on a swipe back to the right", () => {
        expect(sidePanelCloseSwipe({ side: "right" })).toBe("right");
    });

    test("closing is always the opposite of the page swipe that opened it", () => {
        expect(sidePanelCloseSwipe({ side: "left" })).not.toBe("right");
        expect(sidePanelCloseSwipe({ side: "right" })).not.toBe("left");
    });
});