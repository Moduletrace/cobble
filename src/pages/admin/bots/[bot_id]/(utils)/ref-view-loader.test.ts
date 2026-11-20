import { describe, expect, test } from "bun:test";
import loadRefView, { primeRefView, subscribeRefView } from "./ref-view-loader";

/**
 * A read standing in for the app's: one answer per call, in order, and a
 * count of how many times it was asked.
 */
function reader({ answers }: { answers: (unknown | null)[] }) {
    const asked: string[] = [];

    const readOnce = async ({ url }: { url: string }) => {
        asked.push(url);

        return answers[Math.min(asked.length - 1, answers.length - 1)] ?? null;
    };

    return { asked, readOnce };
}

describe("loadRefView", () => {
    test("reads a view once and keeps it, so a thread naming it twice asks once", async () => {
        const { asked, readOnce } = reader({ answers: [{ id: 5, steps: ["One"] }] });

        const first = await loadRefView({ key: "test:kept", url: "/get?id=5", readOnce, retryDelaysMs: [] });
        const second = await loadRefView({ key: "test:kept", url: "/get?id=5", readOnce, retryDelaysMs: [] });

        expect(first).toEqual({ id: 5, steps: ["One"] });
        expect(second).toEqual(first);
        expect(asked).toEqual(["/get?id=5"]);
    });

    test("forgets a read that failed, so the next chip asks again instead of showing nothing", async () => {
        const { asked, readOnce } = reader({ answers: [null, null, { id: 7 }] });

        expect(await loadRefView({ key: "test:forgotten", url: "/get?id=7", readOnce, retryDelaysMs: [] })).toBeNull();
        expect(await loadRefView({ key: "test:forgotten", url: "/get?id=7", readOnce, retryDelaysMs: [] })).toBeNull();
        expect(await loadRefView({ key: "test:forgotten", url: "/get?id=7", readOnce, retryDelaysMs: [] })).toEqual({
            id: 7,
        });
        expect(asked).toHaveLength(3);
    });

    test("tries a failed read again before giving up on it", async () => {
        const { asked, readOnce } = reader({ answers: [null, { id: 9, steps: ["Two"] }] });

        const view = await loadRefView({ key: "test:retried", url: "/get?id=9", readOnce, retryDelaysMs: [0] });

        expect(view).toEqual({ id: 9, steps: ["Two"] });
        expect(asked).toHaveLength(2);

        await loadRefView({ key: "test:retried", url: "/get?id=9", readOnce, retryDelaysMs: [0] });

        expect(asked).toHaveLength(2);
    });

    test("shares one read between callers asking for the same view at once", async () => {
        let release: (value: unknown) => void = () => {};
        let asked = 0;

        const readOnce = () => {
            asked += 1;

            return new Promise<unknown | null>((resolve) => {
                release = resolve;
            });
        };

        const first = loadRefView({ key: "test:shared", url: "/get?id=11", readOnce, retryDelaysMs: [] });
        const second = loadRefView({ key: "test:shared", url: "/get?id=11", readOnce, retryDelaysMs: [] });

        release({ id: 11 });

        expect(await first).toEqual({ id: 11 });
        expect(await second).toEqual({ id: 11 });
        expect(asked).toBe(1);
    });

    test("hands back a view the page already has, without asking", async () => {
        let asked = 0;
        const readOnce = async () => {
            asked += 1;

            return { id: 13 };
        };

        primeRefView({ key: "test:primed", view: { id: 13, status: "answered" } });

        expect(await loadRefView({ key: "test:primed", url: "/get?id=13", readOnce, retryDelaysMs: [] })).toEqual({
            id: 13,
            status: "answered",
        });
        expect(asked).toBe(0);
    });

    test("reads one view per key, not one per id string", async () => {
        const { asked, readOnce } = reader({ answers: [{ id: 15 }, { id: 16 }] });

        await loadRefView({ key: "question:15", url: "/get-question?question_id=15", readOnce, retryDelaysMs: [] });
        await loadRefView({ key: "suggestion:15", url: "/get-suggestion?suggestion_id=15", readOnce, retryDelaysMs: [] });

        expect(asked).toEqual(["/get-question?question_id=15", "/get-suggestion?suggestion_id=15"]);
    });
});
describe("subscribeRefView", () => {
    test("tells every chip naming a view when one of them changes it", () => {
        const first: unknown[] = [];
        const second: unknown[] = [];

        const stopFirst = subscribeRefView({ key: "test:shared-chip", listener: (view) => first.push(view) });
        const stopSecond = subscribeRefView({ key: "test:shared-chip", listener: (view) => second.push(view) });

        primeRefView({ key: "test:shared-chip", view: { id: 21, status: "confirmed" } });

        expect(first).toEqual([{ id: 21, status: "confirmed" }]);
        expect(second).toEqual([{ id: 21, status: "confirmed" }]);

        stopFirst();
        stopSecond();
    });

    test("tells only the chips naming that view", () => {
        const mine: unknown[] = [];
        const other: unknown[] = [];

        const stopMine = subscribeRefView({ key: "test:mine", listener: (view) => mine.push(view) });
        const stopOther = subscribeRefView({ key: "test:other", listener: (view) => other.push(view) });

        primeRefView({ key: "test:mine", view: { id: 23 } });

        expect(mine).toEqual([{ id: 23 }]);
        expect(other).toEqual([]);

        stopMine();
        stopOther();
    });

    test("stops following once the chip is gone", () => {
        const seen: unknown[] = [];

        const stop = subscribeRefView({ key: "test:unsubscribed", listener: (view) => seen.push(view) });

        stop();
        primeRefView({ key: "test:unsubscribed", view: { id: 25 } });

        expect(seen).toEqual([]);
    });

    test("tells the chips already showing it when a read lands", async () => {
        const seen: unknown[] = [];

        const stop = subscribeRefView({ key: "test:read-lands", listener: (view) => seen.push(view) });

        await loadRefView({
            key: "test:read-lands",
            url: "/get?id=27",
            readOnce: async () => ({ id: 27 }),
            retryDelaysMs: [],
        });

        expect(seen).toEqual([{ id: 27 }]);

        stop();
    });
});
