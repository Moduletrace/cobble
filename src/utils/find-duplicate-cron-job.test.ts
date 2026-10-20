import { describe, expect, test } from "bun:test";
import type { BUN_SQLITE_COBBLE_CRON_JOBS } from "@/db/types/db";
import findDuplicateCronJob from "./find-duplicate-cron-job";

const digest: BUN_SQLITE_COBBLE_CRON_JOBS = {
    id: 2,
    title: "Morning digest",
    instructions: "Email the news digest.",
    schedule: "0 6 * * *",
    workspace_id: undefined,
};

const find = (params: Partial<Parameters<typeof findDuplicateCronJob>[0]>) =>
    findDuplicateCronJob({
        cron_jobs: [digest],
        title: "Other",
        instructions: "Something else.",
        schedule: "0 7 * * *",
        ...params,
    });

describe("findDuplicateCronJob", () => {
    test("matches the same title, ignoring case and spacing", () => {
        expect(find({ title: "  morning   DIGEST " })?.id).toBe(2);
    });

    test("matches the same timing and brief under another title", () => {
        expect(find({ schedule: "0 6 * * *", instructions: "Email the news  digest." })?.id).toBe(2);
    });

    test("doesn't match the same brief at another time", () => {
        expect(find({ instructions: "Email the news digest." })).toBeNull();
    });

    test("only matches schedules in the same place", () => {
        expect(find({ title: "Morning digest", workspace_id: 4 })).toBeNull();
    });
});
