import { describe, expect, test } from "bun:test";
import parseBotQuestionRow from "./parse-bot-question-row";

const questions = [{ question: "Which?", kind: "single", options: ["A", "B"], allow_other: false }];

describe("parseBotQuestionRow", () => {
    test("reads questions and answers", () => {
        expect(
            parseBotQuestionRow({
                row: { questions: JSON.stringify(questions), answers: JSON.stringify([{ choices: [1], other: "" }]) },
            }),
        ).toEqual({ questions: questions as never, answers: [{ choices: [1], other: "" }] });
    });

    test("has no answers until answered, or when they don't match", () => {
        expect(parseBotQuestionRow({ row: { questions: JSON.stringify(questions), answers: null } }).answers).toBeNull();
        expect(parseBotQuestionRow({ row: { questions: JSON.stringify(questions), answers: "[]" } }).answers).toBeNull();
    });

    test("survives unreadable JSON", () => {
        expect(parseBotQuestionRow({ row: { questions: "{", answers: "{" } })).toEqual({ questions: [], answers: null });
    });
});
