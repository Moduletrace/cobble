import { describe, expect, test } from "bun:test";
import type { BotQuestionView } from "@/src/types";
import botQuestionAnswersText from "./bot-question-answers-text";

const view: BotQuestionView = {
    id: 4,
    title: "Before I deploy",
    questions: [
        { question: "Which environment?", kind: "single", options: ["Staging", "Production"], allow_other: false },
        { question: "Which checks?", kind: "multiple", options: ["Lint", "Tests", "Build"], allow_other: true },
    ],
    answers: [
        { choices: [0], other: "" },
        { choices: [0, 2], other: "e2e" },
    ],
    status: "answered",
    bot_id: 2,
    bot_name: "Ember",
};

describe("botQuestionAnswersText", () => {
    test("names each question with what was picked", () => {
        expect(botQuestionAnswersText({ view })).toBe(
            [
                "My answers (questions #4):",
                "- **Which environment?** Staging",
                "- **Which checks?** Lint; Build; other: e2e",
            ].join("\n"),
        );
    });

    test("says when the questions were skipped", () => {
        expect(botQuestionAnswersText({ view: { ...view, status: "skipped", answers: null } })).toBe(
            "I skipped your questions (questions #4) without answering them.",
        );
    });
});
