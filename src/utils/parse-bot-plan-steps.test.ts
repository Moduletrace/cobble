import { describe, expect, test } from "bun:test";
import parseBotPlanSteps from "./parse-bot-plan-steps";

/**
 * `bot_plans.steps` is a JSON column written by the app and edited by the
 * user, so a card reads whatever is in it without throwing: a damaged step
 * is dropped, and the rest of the plan still shows.
 */
describe("parseBotPlanSteps", () => {
    test("reads the steps with their state and note", () => {
        const steps = parseBotPlanSteps({
            text: JSON.stringify([
                { text: "Collect the pages", state: "done", note: "14 pages" },
                { text: "Score them", state: "pending", note: "" },
            ]),
        });

        expect(steps).toEqual([
            { text: "Collect the pages", state: "done", note: "14 pages" },
            { text: "Score them", state: "pending", note: "" },
        ]);
    });

    test("an unknown or missing state is a step still to work", () => {
        const steps = parseBotPlanSteps({
            text: JSON.stringify([{ text: "Score them" }, { text: "Write it up", state: "halfway" }]),
        });

        expect(steps.map((step) => step.state)).toEqual(["pending", "pending"]);
    });

    test("drops an entry with no text rather than the whole plan", () => {
        const steps = parseBotPlanSteps({
            text: JSON.stringify([{ text: "  " }, "not a step", { text: " Score them ", state: "done" }]),
        });

        expect(steps).toEqual([{ text: "Score them", state: "done", note: "" }]);
    });

    test("reads nothing from an empty, broken or non-list column", () => {
        expect(parseBotPlanSteps({ text: null })).toEqual([]);
        expect(parseBotPlanSteps({ text: "" })).toEqual([]);
        expect(parseBotPlanSteps({ text: "{oops" })).toEqual([]);
        expect(parseBotPlanSteps({ text: JSON.stringify({ text: "one" }) })).toEqual([]);
    });
});