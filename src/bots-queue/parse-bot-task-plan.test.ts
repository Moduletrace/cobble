import { describe, expect, test } from "bun:test";
import { AppData } from "@/src/data/app-data";
import parseBotTaskPlan from "./parse-bot-task-plan";

const plan = {
    goal: "Ship the release notes",
    gather: ["docs/changelog.md"],
    steps: ["Read the changelog", "Write the notes", "Publish them"],
    done: "The notes are on the site",
};

describe("parseBotTaskPlan", () => {
    test("reads a plan", () => {
        expect(parseBotTaskPlan({ text: JSON.stringify(plan) })).toEqual(plan);
    });

    test("tolerates a code fence and a sentence around the object", () => {
        const fenced = `Here is the plan:\n\`\`\`json\n${JSON.stringify(plan)}\n\`\`\`\nReady.`;

        expect(parseBotTaskPlan({ text: fenced })).toEqual(plan);
    });

    test("fills what a plan may leave out", () => {
        expect(parseBotTaskPlan({ text: `{"goal":"G","steps":["one"]}` })).toEqual({
            goal: "G",
            gather: [],
            steps: ["one"],
            done: "",
        });
    });

    test("is null when it isn't a plan", () => {
        expect(parseBotTaskPlan({})).toBeNull();
        expect(parseBotTaskPlan({ text: null })).toBeNull();
        expect(parseBotTaskPlan({ text: "" })).toBeNull();
        expect(parseBotTaskPlan({ text: "I will just do it." })).toBeNull();
        expect(parseBotTaskPlan({ text: "{nope" })).toBeNull();
        expect(parseBotTaskPlan({ text: `{"goal":"G"}` })).toBeNull();
        expect(parseBotTaskPlan({ text: `{"goal":"","steps":["one"]}` })).toBeNull();
        expect(parseBotTaskPlan({ text: `{"goal":"G","steps":[]}` })).toBeNull();
    });

    test("caps how much a plan may ask for", () => {
        const too_many = {
            goal: "G",
            steps: Array.from({ length: AppData.BotTaskPlanMaxSteps + 1 }, (_, index) => `step ${index}`),
        };

        expect(parseBotTaskPlan({ text: JSON.stringify(too_many) })).toBeNull();
        expect(
            parseBotTaskPlan({
                text: JSON.stringify({ ...too_many, steps: too_many.steps.slice(1), goal: "x".repeat(AppData.BotTaskPlanTextMaxChars + 1) }),
            }),
        ).toBeNull();
    });
});