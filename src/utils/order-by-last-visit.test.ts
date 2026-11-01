import { describe, expect, test } from "bun:test";
import orderByLastVisit from "./order-by-last-visit";

type Item = { id: number; last_visited_at?: number | null };

function ids(items: Item[]) {
    return orderByLastVisit({ items }).map((item) => item.id);
}

describe("orderByLastVisit", () => {
    test("visited items lead, latest first, the rest keep their order", () => {
        expect(
            ids([
                { id: 1 },
                { id: 2, last_visited_at: 100 },
                { id: 3 },
                { id: 4, last_visited_at: 300 },
                { id: 5, last_visited_at: 200 },
            ]),
        ).toEqual([4, 5, 2, 1, 3]);
    });

    test("unchanged when none were visited", () => {
        expect(ids([{ id: 2 }, { id: 1, last_visited_at: null }])).toEqual([2, 1]);
    });

    test("leaves the list it was given alone", () => {
        const items = [
            { id: 1, last_visited_at: 1 },
            { id: 2, last_visited_at: 2 },
        ];

        orderByLastVisit({ items });

        expect(items.map((item) => item.id)).toEqual([1, 2]);
    });
});
