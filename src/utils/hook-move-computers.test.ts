import { describe, expect, test } from "bun:test";
import AppError from "./app-error";
import hookMoveComputers from "./hook-move-computers";

describe("hookMoveComputers", () => {
    test("keeps the run computer the bot reaches there", () => {
        expect(hookMoveComputers({ title: "H", watching: false, computer_id: 3, reachable_ids: [1, 3] })).toEqual({
            computer_id: 3,
            computer_dropped: false,
        });
    });

    test("drops one it doesn't reach", () => {
        expect(hookMoveComputers({ title: "H", watching: false, computer_id: 3, reachable_ids: [1] })).toEqual({
            computer_id: null,
            computer_dropped: true,
        });
    });

    test("nothing to drop without a run computer", () => {
        expect(hookMoveComputers({ title: "H", watching: false, computer_id: null, reachable_ids: [] })).toEqual({
            computer_id: null,
            computer_dropped: false,
        });
    });

    test("a notification hook needs its watched computer there", () => {
        expect(() =>
            hookMoveComputers({ title: "H", watching: true, computer_id: 2, watch_computer_id: 2, reachable_ids: [1] }),
        ).toThrow(AppError);

        expect(
            hookMoveComputers({ title: "H", watching: true, computer_id: 2, watch_computer_id: 2, reachable_ids: ["2"] }),
        ).toEqual({ computer_id: 2, computer_dropped: false });
    });
});
