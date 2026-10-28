import { describe, expect, test } from "bun:test";
import type { BotQuestionItem } from "@/src/types";
import checkBotQuestionAnswers from "./check-bot-question-answers";

const questions: BotQuestionItem[] = [
    { question: "Which environment?", kind: "single", options: ["Staging", "Production"], allow_other: false },
    { question: "Which checks?", kind: "multiple", options: ["Lint", "Tests", "Build"], allow_other: true },
];

describe("checkBotQuestionAnswers", () => {
    test("tidies valid answers", () => {
        expect(
            checkBotQuestionAnswers({
                questions,
                answers: [{ choices: [1] }, { choices: [2, 0, 2], other: "  e2e  " }],
            }),
        ).toEqual([
            { choices: [1], other: "" },
            { choices: [0, 2], other: "e2e" },
        ]);
    });

    test("takes Other alone where it's allowed", () => {
        expect(checkBotQuestionAnswers({ questions, answers: [{ choices: [0] }, { choices: [], other: "None" }] })[1]).toEqual({
            choices: [],
            other: "None",
        });
    });

    test("needs one answer per question", () => {
        expect(() => checkBotQuestionAnswers({ questions, answers: [{ choices: [0] }] })).toThrow("Answer every question.");
    });

    test("needs every question answered", () => {
        expect(() => checkBotQuestionAnswers({ questions, answers: [{ choices: [0] }, { choices: [], other: "  " }] })).toThrow(
            "Answer question 2.",
        );
    });

    test("takes one pick for a single-choice question", () => {
        expect(() => checkBotQuestionAnswers({ questions, answers: [{ choices: [0, 1] }, { choices: [0] }] })).toThrow(
            "Question 1 takes one answer.",
        );
    });

    test("refuses options that don't exist", () => {
        expect(() => checkBotQuestionAnswers({ questions, answers: [{ choices: [2] }, { choices: [0] }] })).toThrow(
            "Question 1 has an option that doesn't exist.",
        );
    });

    test("refuses Other where it isn't allowed", () => {
        expect(() =>
            checkBotQuestionAnswers({ questions, answers: [{ choices: [], other: "QA" }, { choices: [0] }] }),
        ).toThrow("Question 1 only takes its options.");
    });
});
