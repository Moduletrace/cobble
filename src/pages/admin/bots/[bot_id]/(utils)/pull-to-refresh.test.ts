import { describe, expect, test } from "bun:test";
import pullToRefreshState, {
    PullToRefreshMinPx,
    PullToRefreshResistance,
    PullToRefreshRoomPx,
} from "./pull-to-refresh";

/**
 * The finger travel that opens the room to its limit.
 */
const full_travel = PullToRefreshRoomPx / PullToRefreshResistance;

describe("pullToRefreshState", () => {
    test("a tap or a downward drag is not a pull", () => {
        expect(pullToRefreshState({ start_y: 300, current_y: 300 }).pulling).toBe(false);
        expect(pullToRefreshState({ start_y: 300, current_y: 360 }).pulling).toBe(false);
        expect(pullToRefreshState({ start_y: 300, current_y: 360 }).distance).toBe(0);
    });

    test("just under the minimum travel still isn't a pull", () => {
        const pulled = pullToRefreshState({ start_y: 300, current_y: 300 - PullToRefreshMinPx + 1 });

        expect(pulled.pulling).toBe(false);
        expect(pulled.ready).toBe(false);
    });

    test("travel resists", () => {
        const short = pullToRefreshState({ start_y: 300, current_y: 250 });

        expect(short.distance).toBeCloseTo(50 * PullToRefreshResistance);
        expect(short.pulling).toBe(true);
        expect(short.ready).toBe(false);
    });

    test("a room only started, with nothing but paper under it, is not a reload", () => {
        const pulled = pullToRefreshState({
            start_y: 400,
            current_y: 400 - full_travel + 1,
        });

        expect(pulled.distance).toBeLessThan(PullToRefreshRoomPx);
        expect(pulled.ready).toBe(false);
    });

    test("letting go at the limit reloads", () => {
        const pulled = pullToRefreshState({ start_y: 400, current_y: 400 - full_travel });

        expect(pulled.distance).toBeCloseTo(PullToRefreshRoomPx);
        expect(pulled.ready).toBe(true);
    });

    test("opens no further than the room the icon needs", () => {
        const capped = pullToRefreshState({ start_y: 900, current_y: 0 });

        expect(capped.distance).toBe(PullToRefreshRoomPx);
        expect(capped.ready).toBe(true);
    });

    test("resistance can be changed, e.g. for a test or a heavier pull", () => {
        const pulled = pullToRefreshState({ start_y: 100, current_y: 80, resistance: 1 });

        expect(pulled.distance).toBe(20);
        expect(pulled.ready).toBe(false);
    });
});