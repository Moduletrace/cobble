import type { BotQuestionAnswer, BotQuestionItem } from "@/src/types";
import AppError from "./app-error";

type Params = {
    questions: BotQuestionItem[];
    answers: { choices: number[]; other?: string }[];
};

/**
 * The user's answers checked against the questions they answer: one per
 * question, only options that exist, "Other" only where it's allowed,
 * exactly one pick for a single-choice question and at least one for a
 * multiple-choice one. Returns them tidied (choices sorted and unique,
 * "Other" trimmed); throws an `AppError` naming the first question that
 * isn't answered right.
 */
export default function checkBotQuestionAnswers({ questions, answers }: Params): BotQuestionAnswer[] {
    if (answers.length != questions.length) {
        throw new AppError(`Answer every question.`);
    }

    return questions.map((item, index) => {
        const answer = answers[index]!;
        const choices = [...new Set(answer.choices)].sort((a, b) => a - b);
        const other = (answer.other || "").trim();
        const label = `Question ${index + 1}`;

        if (choices.some((choice) => !Number.isInteger(choice) || choice < 0 || choice >= item.options.length)) {
            throw new AppError(`${label} has an option that doesn't exist.`);
        }

        if (other && !item.allow_other) {
            throw new AppError(`${label} only takes its options.`);
        }

        const picked = choices.length + (other ? 1 : 0);

        if (!picked) throw new AppError(`Answer ${label.toLowerCase()}.`);

        if (item.kind == "single" && picked > 1) {
            throw new AppError(`${label} takes one answer.`);
        }

        return { choices, other };
    });
}
