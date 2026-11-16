import { describe, expect, test } from "bun:test";
import type { BotPlanStepRecord } from "@/src/utils/parse-bot-plan-steps";
import planStepsRewriteProblem from "./plan-steps-rewrite-problem";

/**
 * Changing a plan's steps is the user's right, with one limit: what was
 * already worked is the record of work that really happened, so it stays at
 * the top with its note and nothing may take its place.
 */
const step = ({ text, state = "pending", note = "" }: Partial<BotPlanStepRecord>): BotPlanStepRecord => ({
    text: text || "",
    state,
    note,
});

describe("planStepsRewriteProblem", () => {
    test("allows rewriting everything after the finished steps", () => {
        const finished = [step({ text: "Collect the pages", state: "done", note: "14 pages" })];
        const next = [step({ text: "collect the pages", state: "done", note: "14 pages" }), step({ text: "Score them" })];

        expect(planStepsRewriteProblem({ finished, next })).toBeNull();
    });

    test("allows adding steps onto a plan nothing was worked in", () => {
        expect(
            planStepsRewriteProblem({
                finished: [],
                next: [step({ text: "one" }), step({ text: "two" })],
            }),
        ).toBeNull();
    });

    test("refuses changing what a finished step says", () => {
        const problem = planStepsRewriteProblem({
            finished: [step({ text: "Collect the pages", state: "done" })],
            next: [step({ text: "Collect every page", state: "done" })],
        });

        expect(problem).toContain("already done");
    });

    test("refuses dropping a finished step", () => {
        const problem = planStepsRewriteProblem({
            finished: [step({ text: "Collect the pages", state: "done" })],
            next: [step({ text: "Score them" })],
        });

        expect(problem?.length).toBeGreaterThan(0);
    });

    test("refuses moving a finished step below another", () => {
        const problem = planStepsRewriteProblem({
            finished: [step({ text: "Collect the pages", state: "done" })],
            next: [step({ text: "Score them" }), step({ text: "Collect the pages", state: "done" })],
        });

        expect(problem?.length).toBeGreaterThan(0);
    });

    test("names one finished step in the singular, several in the plural", () => {
        expect(
            planStepsRewriteProblem({ finished: [step({ text: "a", state: "done" })], next: [step({ text: "b" })] }),
        ).toContain("A step that's already done");

        expect(
            planStepsRewriteProblem({
                finished: [step({ text: "a", state: "done" }), step({ text: "b", state: "skipped" })],
                next: [step({ text: "c" })],
            }),
        ).toContain("The steps already done");
    });
});