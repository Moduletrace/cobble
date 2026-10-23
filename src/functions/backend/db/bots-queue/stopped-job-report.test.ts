import { describe, expect, test } from "bun:test";
import { BotStoppedMessage } from "@/src/dict/bot-queue-dict";
import stoppedJobReport, { pickReportedJobs } from "./stopped-job-report";

describe("stoppedJobReport", () => {
    test("a stopped task names the work that was cut off", () => {
        expect(stoppedJobReport({ job: { session_id: 1, kind: "task", title: "The audit" } })).toBe(
            `${BotStoppedMessage} I was on **The audit**.`,
        );
    });

    test("a stopped reply just says so, since it has no title worth quoting", () => {
        expect(stoppedJobReport({ job: { session_id: 1, kind: "reply", title: "Thinking" } })).toBe(
            BotStoppedMessage,
        );
    });

    test("a task without a title doesn't leave a dangling bold sentence", () => {
        expect(stoppedJobReport({ job: { session_id: 1, kind: "task", title: "   " } })).toBe(
            BotStoppedMessage,
        );
    });

    test("the message is a sentence the user can read, and it says the bot waits for them", () => {
        expect(BotStoppedMessage).toContain("Stopped");
        expect(BotStoppedMessage).toContain("when you ask");
    });
});

describe("pickReportedJobs", () => {
    test("one job speaks per session, so a reply and the task it started don't both report", () => {
        const picked = pickReportedJobs({
            jobs: [
                { session_id: 7, kind: "reply", id: 1 },
                { session_id: 7, kind: "task", id: 2 },
            ],
        });

        expect([...picked.keys()]).toEqual([7]);
    });

    test("the task wins, since it's the one that can name the work", () => {
        const picked = pickReportedJobs({
            jobs: [
                { session_id: 7, kind: "reply", id: 1 },
                { session_id: 7, kind: "task", id: 2 },
            ],
        });

        expect(picked.get(7)?.id).toBe(2);
    });

    test("a task first isn't replaced by a later reply", () => {
        const picked = pickReportedJobs({
            jobs: [
                { session_id: 7, kind: "task", id: 2 },
                { session_id: 7, kind: "reply", id: 1 },
            ],
        });

        expect(picked.get(7)?.id).toBe(2);
    });

    test("every session gets its own report", () => {
        const picked = pickReportedJobs({
            jobs: [
                { session_id: 7, kind: "reply", id: 1 },
                { session_id: 8, kind: "task", id: 2 },
                { session_id: 9, kind: "task", id: 3 },
            ],
        });

        expect([...picked.keys()].sort()).toEqual([7, 8, 9]);
    });

    test("nothing open picks nothing", () => {
        expect(pickReportedJobs({ jobs: [] }).size).toBe(0);
    });
});
