import { describe, expect, test } from "bun:test";
import orderByLastVisit from "./order-by-last-visit";

type Item = { id: number; last_visited_at?: number | null; created_at?: number | null };

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

    test("the pinned item leads even when another was visited later", () => {
        const items = [
            { id: 1, last_visited_at: 500 },
            { id: 2, last_visited_at: 900 },
            { id: 3 },
            { id: 4, last_visited_at: 400 },
        ];

        expect(orderByLastVisit({ items, pinned_id: 1 }).map((item) => item.id)).toEqual([1, 2, 4, 3]);
        expect(orderByLastVisit({ items, pinned_id: 3 }).map((item) => item.id)).toEqual([3, 2, 1, 4]);
    });

    test("the pin matches the id either way and changes nothing when absent", () => {
        const items = [
            { id: 1, last_visited_at: 100 },
            { id: 2, last_visited_at: 200 },
        ];

        expect(orderByLastVisit({ items, pinned_id: "2" }).map((item) => item.id)).toEqual([2, 1]);
        expect(orderByLastVisit({ items, pinned_id: 9 }).map((item) => item.id)).toEqual([2, 1]);
        expect(orderByLastVisit({ items, pinned_id: null }).map((item) => item.id)).toEqual([2, 1]);
    });

    test("a new unvisited item leads when ranked by creation", () => {
        const items = [
            { id: 1, created_at: 10, last_visited_at: 500 },
            { id: 2, created_at: 20 },
            { id: 3, created_at: 900 },
            { id: 4, created_at: 30, last_visited_at: 400 },
        ];

        expect(orderByLastVisit({ items, unvisited_by_created: true }).map((item) => item.id)).toEqual([3, 1, 4, 2]);
        expect(orderByLastVisit({ items }).map((item) => item.id)).toEqual([1, 4, 2, 3]);
    });
});
