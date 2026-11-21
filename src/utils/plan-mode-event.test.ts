import { describe, expect, test } from "bun:test";
import announcePlanModeOff, { PlanModeOffEvent } from "./plan-mode-event";

describe("announcePlanModeOff", () => {
    test("announces Plan mode off on the window it is given", () => {
        const target = new EventTarget();
        let heard = 0;

        target.addEventListener(PlanModeOffEvent, () => {
            heard += 1;
        });

        announcePlanModeOff({ target });

        expect(heard).toBe(1);
        expect(PlanModeOffEvent).toBe("cobble:plan-mode-off");
    });

    test("does nothing when there is no window", () => {
        expect(() => announcePlanModeOff({ target: null })).not.toThrow();
    });
});