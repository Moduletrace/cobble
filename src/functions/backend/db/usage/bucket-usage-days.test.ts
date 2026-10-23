import { describe, expect, test } from "bun:test";
import bucketUsageDays, { localDate } from "./bucket-usage-days";
import { DayMs, startOfDay } from "./grab-usage-window";

function row(local_day: string, tokens: number) {
    return {
        local_day,
        calls: 1,
        prompt_tokens: tokens,
        completion_tokens: 0,
        cost: null,
    };
}

const now = new Date(2026, 9, 23, 15, 0, 0).getTime();
const end = now;
const start = startOfDay({ at: now }) - 2 * DayMs;

describe("localDate", () => {
    test("names the local calendar day, not the UTC one", () => {
        /**
         * Half an hour past local midnight is still the previous UTC day
         * for anyone east of Greenwich, and the bug the chart had: the row
         * was counted under one name and looked for under another.
         */
        const at = new Date(2026, 9, 23, 0, 30, 0).getTime();

        expect(localDate({ at })).toBe("2026-10-23");
    });

    test("pads a single-digit month and day", () => {
        expect(localDate({ at: new Date(2026, 0, 5, 12, 0, 0).getTime() })).toBe("2026-01-05");
    });
});

describe("bucketUsageDays", () => {
    test("one bucket per day of the window, oldest first", () => {
        const days = bucketUsageDays({ rows: [], start, end });

        expect(days.length).toBe(3);
        expect(days.map((day) => day.label)).toEqual(
            [2, 1, 0].map((back) => localDate({ at: startOfDay({ at: now }) - back * DayMs })),
        );
    });

    test("every row lands in its day, and yesterday's late call does not vanish", () => {
        const today = localDate({ at: startOfDay({ at: now }) });
        const yesterday = localDate({ at: startOfDay({ at: now }) - DayMs });

        const days = bucketUsageDays({
            rows: [row(today, 1500), row(yesterday, 400)],
            start,
            end,
        });

        const by_label = new Map(days.map((day) => [day.label, day.total_tokens]));

        expect(by_label.get(today)).toBe(1500);
        expect(by_label.get(yesterday)).toBe(400);
        expect(days.reduce((total, day) => total + day.total_tokens, 0)).toBe(1900);
    });

    test("a day with nothing in it is still a bucket, at zero", () => {
        const days = bucketUsageDays({
            rows: [row(localDate({ at: startOfDay({ at: now }) }), 100)],
            start,
            end,
        });

        expect(days.filter((day) => day.total_tokens === 0).length).toBe(2);
        expect(days.every((day) => day.calls === 0 || day.calls === 1)).toBe(true);
    });

    test("a bucket's midnight is that day's local midnight", () => {
        const days = bucketUsageDays({ rows: [], start, end });

        for (const day of days) {
            expect(day.at).toBe(startOfDay({ at: day.at }));
            expect(localDate({ at: day.at })).toBe(day.label);
        }
    });

    test("cost and calls are summed, not counted twice", () => {
        const label = localDate({ at: startOfDay({ at: now }) });

        const days = bucketUsageDays({
            rows: [
                { ...row(label, 100), calls: 3, cost: 0.25 },
                { ...row(label, 50), calls: 2, cost: 0.5 },
            ],
            start,
            end,
        });

        const bucket = days.find((day) => day.label === label);

        expect(bucket?.total_tokens).toBe(150);
        expect(bucket?.cost).toBe(0.75);
        expect(days.reduce((total, day) => total + day.calls, 0)).toBe(5);
    });
});
