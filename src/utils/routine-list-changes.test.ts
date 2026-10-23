import { describe, expect, test } from "bun:test";
import type { CronJobWithNames } from "@/src/types";
import { dropRoutine, replaceRoutine } from "./routine-list-changes";

function routine({ id, title }: { id: number | string; title: string }): CronJobWithNames {
    return { ...({ id, title, enabled: 1, schedule: "0 9 * * *" } as CronJobWithNames) };
}

const routines = [routine({ id: 1, title: "Morning" }), routine({ id: 2, title: "Evening" })];

describe("replaceRoutine", () => {
    test("swaps in the saved version in the same place", () => {
        const saved = routine({ id: 2, title: "Evening, paused" });
        const next = replaceRoutine({ routines, cron_job: saved });

        expect(next.map((item) => item.id)).toEqual([1, 2]);
        expect(next[1]!.title).toBe("Evening, paused");
    });

    test("matches a string id against a numeric one", () => {
        const next = replaceRoutine({
            routines: [routine({ id: "1", title: "Morning" }), routine({ id: 2, title: "Evening" })],
            cron_job: routine({ id: 1, title: "Morning, paused" }),
        });

        expect(next[0]!.title).toBe("Morning, paused");
        expect(next.length).toBe(2);
    });

    test("leaves every other routine alone", () => {
        expect(replaceRoutine({ routines, cron_job: routine({ id: 99, title: "Not here" }) })).toEqual(routines);
    });

    test("does not change the list it was given", () => {
        const copy = [...routines];
        replaceRoutine({ routines, cron_job: routine({ id: 1, title: "Changed" }) });

        expect(routines).toEqual(copy);
    });
});

describe("dropRoutine", () => {
    test("removes the deleted one and keeps the rest", () => {
        expect(dropRoutine({ routines, cron_job_id: 1 }).map((item) => item.id)).toEqual([2]);
    });

    test("matches a string id", () => {
        expect(dropRoutine({ routines, cron_job_id: "2" }).map((item) => item.id)).toEqual([1]);
    });

    test("an id that isn't there changes nothing", () => {
        expect(dropRoutine({ routines, cron_job_id: 42 })).toEqual(routines);
    });
});
