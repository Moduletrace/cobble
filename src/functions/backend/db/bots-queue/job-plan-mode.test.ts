import { describe, expect, test } from "bun:test";
import jobPlanMode from "./job-plan-mode";

describe("jobPlanMode", () => {
    test("a reply queued from a Plan mode message", () => {
        expect(jobPlanMode({ job: { params: `{"plan_mode":true}` } })).toBe(true);
    });

    test("a reply queued with other params", () => {
        expect(jobPlanMode({ job: { params: `{"retry_of":980,"plan_mode":true}` } })).toBe(true);
    });

    test("an ordinary reply", () => {
        expect(jobPlanMode({ job: { params: `{"plan_id":4}` } })).toBe(false);
    });

    test("no params at all, as a task run has", () => {
        expect(jobPlanMode({ job: { params: undefined } })).toBe(false);
        expect(jobPlanMode({ job: {} })).toBe(false);
    });

    test("params it can't read", () => {
        expect(jobPlanMode({ job: { params: "not json" } })).toBe(false);
    });
});